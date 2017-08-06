import BluebirdPromise from "bluebird-lst"
import { readJson } from "fs-extra-p"
import { Lazy } from "lazy-val"
import * as path from "path"
import "source-map-support/register"
import { Configuration, Plugin, Rule } from "webpack"
import { configureTypescript } from "./configurators/ts"
import { configureVue } from "./configurators/vue/vue"
import { ConfigurationEnv, ConfigurationType, ElectronWebpackConfig, PackageMetadata } from "./core"
import { BaseTarget } from "./targets/BaseTarget"
import { MainTarget } from "./targets/MainTarget"
import { BaseRendererTarget, RendererTarget } from "./targets/RendererTarget"
import { getFirstExistingFile, orNullIfFileNotExist } from "./util"

const _debug = require("debug")

export class WebpackConfigurator {
  readonly projectDir: string

  private electronVersionPromise = new Lazy(() => getInstalledElectronVersion(this.projectDir))

  readonly env: ConfigurationEnv

  readonly isRenderer: boolean
  readonly isProduction: boolean
  readonly isTest = this.type === "test"

  readonly sourceDir: string

  metadata: PackageMetadata
  electronWebpackConfig: ElectronWebpackConfig

  readonly debug = _debug(`electron-webpack:${this.type}`)

  config: Configuration

  readonly rules: Array<Rule> = []
  readonly plugins: Array<Plugin> = []

  // js must be first - e.g. iview has two files loading-bar.js and loading-bar.vue - when we require "loading-bar", js file must be resolved and not vue
  readonly extensions: Array<string> = [".js", ".json", ".node"]

  electronVersion: string

  readonly entryFiles: Array<string> = []

  constructor(readonly type: ConfigurationType, env: ConfigurationEnv | null) {
    this.env = env || {}
    this.projectDir = this.env.projectDir || process.cwd()
    this.isRenderer = type.startsWith("renderer")
    process.env.BABEL_ENV = type

    this.isProduction = this.env.production !== false && this.env.production !== "false" && (this.env.production === true || this.env.production === "true" || process.env.NODE_ENV === "production")
    this.debug(`isProduction: ${this.isProduction}`)

    this.sourceDir = this.getSourceDirectory(this.type)
  }

  getSourceDirectory(type: ConfigurationType) {
    return path.join(this.commonSourceDirectory, type.startsWith("renderer") || type === "test" ? "renderer" : type)
  }

  get commonDistDirectory() {
    return path.join(this.projectDir, "dist")
  }

  get commonSourceDirectory() {
    return path.join(this.projectDir, "src")
  }

  hasDependency(name: string) {
    return name in this.metadata.dependencies || this.hasDevDependency(name)
  }

  hasDevDependency(name: string) {
    return name in this.metadata.devDependencies
  }

  async configure(entry?: { [key: string]: any } | null) {
    const projectInfo = await BluebirdPromise.all([
      orNullIfFileNotExist(readJson(path.join(this.projectDir, "package.json"))),
      entry == null ? computeEntryFile(this.sourceDir, this.projectDir) : BluebirdPromise.resolve(),
    ])

    this.metadata = projectInfo[0] || {}
    if (this.metadata.dependencies == null) {
      this.metadata.dependencies = {}
    }
    if (this.metadata.devDependencies == null) {
      this.metadata.devDependencies = {}
    }

    this.electronWebpackConfig = this.env.configuration || this.metadata.electronWebpack || {}
    if (this.electronWebpackConfig.renderer == null) {
      this.electronWebpackConfig.renderer = {}
    }

    this.config = {
      context: this.projectDir,
      devtool: this.isProduction || this.isTest ? "nosources-source-map" : "eval-source-map",
      externals: this.computeExternals(),
      node: {
        __dirname: !this.isProduction,
        __filename: !this.isProduction,
      },
      output: {
        filename: "[name].js",
        chunkFilename: "[name].bundle.js",
        libraryTarget: "commonjs2",
        path: path.join(this.commonDistDirectory, this.type)
      },
      target: this.isTest ? "node" : `electron-${this.type === "renderer-dll" ? "renderer" : this.type}` as any,
      resolve: {
        alias: {
          "@": this.sourceDir,
          common: path.join(this.commonSourceDirectory, "common"),
        },
        extensions: this.extensions,
      },
      module: {
        rules: this.rules,
      },
      plugins: this.plugins,
    }

    if (entry != null) {
      this.config.entry = entry
    }

    // if electronVersion not specified, use latest
    this.electronVersion = this.electronWebpackConfig.electronVersion || await this.electronVersionPromise.value || "1.7.5"
    const target = (() => {
      switch (this.type) {
        case "renderer": return new RendererTarget()
        case "renderer-dll": return new BaseRendererTarget()
        case "test": return new BaseRendererTarget()
        case "main": return new MainTarget()
        default: return new BaseTarget()
      }
    })()
    this.debug(`Target class: ${target.constructor.name}`)
    target.configureRules(this)
    await BluebirdPromise.all([target.configurePlugins(this), configureTypescript(this)])
    configureVue(this)

    if (this.debug.enabled) {
      this.debug(`\n\n${this.type} config:` + JSON.stringify(this.config, null, 2) + "\n\n")
    }

    if (this.config.entry == null) {
      this.entryFiles.push(projectInfo[1]!!)
      this.config.entry = {
        [this.type]: this.entryFiles,
      }

      if (this.type === "main" && this.electronWebpackConfig.main != null) {
        let extraEntries = this.electronWebpackConfig.main.extraEntries
        if (extraEntries != null) {
          if (typeof extraEntries === "string") {
            extraEntries = [extraEntries]
          }

          if (Array.isArray(extraEntries)) {
            for (const p of extraEntries) {
              this.config.entry[path.basename(p, path.extname(p))] = p
            }
          }
          else {
            Object.assign(this.config.entry, extraEntries)
          }
        }
      }
    }
    return this.config
  }

  private computeExternals() {
    const whiteListedModules = new Set(this.electronWebpackConfig.whiteListedModules || [])
    if (this.isRenderer) {
      whiteListedModules.add("vue")
    }

    const filter = (name: string) => !name.startsWith("@types/") && (whiteListedModules == null || !whiteListedModules.has(name))
    const externals: Array<string> = Object.keys(this.metadata.dependencies).filter(filter)
    externals.push("electron")
    externals.push("webpack")
    // because electron-devtools-installer specified in the devDependencies, but required in the index.dev
    externals.push("electron-devtools-installer")
    if (this.type === "main") {
      externals.push("webpack/hot/log-apply-result")
      externals.push("electron-webpack/electron-main-hmr/HmrClient")
      externals.push("source-map-support/source-map-support.js")
    }

    if (this.electronWebpackConfig.externals != null) {
      return externals.concat(this.electronWebpackConfig.externals)
    }

    return externals
  }
}

export function configure(type: ConfigurationType, env: ConfigurationEnv | null) {
  return new WebpackConfigurator(type, env).configure()
}

async function computeEntryFile(srcDir: string, projectDir: string): Promise<string | null> {
  const file = await getFirstExistingFile(["index.ts", "main.ts", "index.js", "main.js"], srcDir)
  if (file == null) {
    throw new Error(`Cannot find entry file ${path.relative(projectDir, path.join(srcDir, "index.ts"))} (or .js)`)
  }
  return file
}

async function getInstalledElectronVersion(projectDir: string) {
  for (const name of ["electron", "electron-prebuilt", "electron-prebuilt-compile"]) {
    try {
      return (await readJson(path.join(projectDir, "node_modules", name, "package.json"))).version
    }
    catch (e) {
      if (e.code !== "ENOENT") {
        throw e
      }
    }
  }
}
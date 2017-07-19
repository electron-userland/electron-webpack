import BluebirdPromise from "bluebird-lst"
import { readJson, stat } from "fs-extra-p"
import * as path from "path"
import "source-map-support/register"
import { Configuration, NewModule, Plugin, Rule } from "webpack"
import { configureTypescript } from "./configurators/ts"
import { configureVue } from "./configurators/vue"
import { ConfigEnv, ConfigurationType, ElectronWebpackConfig, PackageMetadata } from "./core"
import { BaseTarget } from "./targets/BaseTarget"
import { BaseRendererTarget, RendererTarget } from "./targets/RendererTarget"
import { Lazy, statOrNull } from "./util"

const _debug = require("debug")

export class WebpackConfigurator {
  readonly projectDir = process.cwd()

  private electronVersionPromise = new Lazy(() => getInstalledElectronVersion(this.projectDir))

  readonly env: ConfigEnv

  readonly isRenderer: boolean
  readonly isProduction: boolean
  readonly isTest = this.type === "test"

  readonly sourceDir: string

  metadata: PackageMetadata
  electronWebpackConfig: ElectronWebpackConfig

  readonly debug = _debug(`electron-webpack:${this.type}`)

  config: Configuration

  rules: Array<Rule>
  plugins: Array<Plugin>
  extensions: Array<string>

  electronVersion: string

  constructor(readonly type: ConfigurationType, env: ConfigEnv | null) {
    this.env = env || {}
    this.isRenderer = type.startsWith("renderer")
    process.env.BABEL_ENV = type

    this.isProduction = this.env.production !== false && this.env.production !== "false" && (this.env.production === true || this.env.production === "true" || process.env.NODE_ENV === "production")
    this.debug(`isProduction: ${this.isProduction}`)

    this.sourceDir = path.join(this.projectDir, "src", this.type === "test" || this.isRenderer ? "renderer" : this.type)
  }

  get commonDistDirectory() {
    return path.join(this.projectDir, "dist")
  }

  async configure(entry?: { [key: string]: any } | null) {
    const projectInfo = await BluebirdPromise.all([
      readJson(path.join(this.projectDir, "package.json")),
      entry == null ? computeEntryFile(this.sourceDir, this.projectDir) : BluebirdPromise.resolve(),
    ])

    this.metadata = projectInfo[0]
    if (this.metadata.dependencies == null) {
      this.metadata.dependencies = {}
    }
    if (this.metadata.devDependencies == null) {
      this.metadata.devDependencies = {}
    }

    this.electronWebpackConfig = this.metadata.electronWebpack || {}
    if (this.electronWebpackConfig.renderer == null) {
      this.electronWebpackConfig.renderer = {}
    }

    const config: Configuration = this.type === "main" ? {} : {
      resolve: {
        alias: {
          "@": path.join(this.projectDir, "src/renderer"),
          vue$: "vue/dist/vue.esm.js",
          "vue-router$": "vue-router/dist/vue-router.esm.js",
        },
        extensions: [".vue", ".css"]
      },
    }

    this.config = config
    Object.assign(this.config, {
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
      target: this.isTest ? "node" : `electron-${this.type === "renderer-dll" ? "renderer" : this.type}`,
    })

    if (this.config.module == null) {
      this.config.module = {rules: []}
    }

    if (this.config.entry == null) {
      if (this.type === "renderer-dll") {
        const dll = this.electronWebpackConfig.renderer.dll
        if (dll == null) {
          throw new Error(`renderer-dll requires DLL configuration`)
        }

        this.config.entry = Array.isArray(dll) ? {vendor: dll} : dll
      }
      else if (entry != null) {
        this.config.entry = entry
      }
      else {
        const mainEntry = []
        if (!this.isProduction && this.type === "main") {
          mainEntry.push(path.join(__dirname, "../electron-main-hmr/main-hmr"))

          const devIndexFile = path.join(this.projectDir, "src/main/index.dev.ts")
          if ((await statOrNull(devIndexFile)) != null) {
            mainEntry.push(devIndexFile)
          }
        }
        mainEntry.push(projectInfo[1])

        this.config.entry = {
          [this.type]: mainEntry,
        }
      }
    }

    this.rules = (this.config.module as NewModule).rules
    this.plugins = getPlugins(this.config)
    this.extensions = getExtensions(config)

    this.electronVersion = this.electronWebpackConfig.electronVersion || await this.electronVersionPromise.value
    const target = (() => {
      switch (this.type) {
        case "renderer": return new RendererTarget()
        case "renderer-dll": return new BaseRendererTarget()
        case "test": return new BaseRendererTarget()
        default: return new BaseTarget()
      }
    })()
    this.debug(`Target class: ${target.constructor.name}`)
    target.configureRules(this)
    await BluebirdPromise.all([target.configurePlugins(this), configureTypescript(this)])
    configureVue(this)

    if (this.debug.enabled) {
      this.debug(`\n\n${this.type} config:` + JSON.stringify(config, null, 2) + "\n\n")
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
    return externals
  }
}

export function configure(type: ConfigurationType, env: ConfigEnv | null, entry?: { [key: string]: any } | null) {
  return new WebpackConfigurator(type, env).configure(entry)
}

async function computeEntryFile(srcDir: string, projectDir: string) {
  for (const name of ["index.ts", "main.ts", "index.js", "main.ts"]) {
    const file = path.join(srcDir, name)
    try {
      await stat(file)
      return file
    }
    catch (e) {
      // ignore
    }
  }
  throw new Error(`Cannot find entry file ${path.relative(projectDir, path.join(srcDir, "index.ts"))}`)
}

function getPlugins(config: Configuration) {
  let plugins = config.plugins
  if (plugins == null) {
    plugins = []
    config.plugins = plugins
  }
  return plugins
}

function getExtensions(config: Configuration) {
  let resolve = config.resolve
  if (resolve == null) {
    resolve = {}
    config.resolve = resolve
  }

  let extensions = resolve.extensions
  if (extensions == null) {
    extensions = []
    resolve.extensions = extensions
  }

  // js must be first - e.g. iview has two files loading-bar.js and loading-bar.vue - when we require "loading-bar", js file must be resolved and not vue
  extensions.unshift(".js")
  extensions.push(".node", ".json")
  return extensions
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
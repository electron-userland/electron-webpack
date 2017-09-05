import Ajv from "ajv"
import BluebirdPromise from "bluebird-lst"
import { readJson } from "fs-extra-p"
import { Lazy } from "lazy-val"
import * as path from "path"
import { getConfig } from "read-config-file"
import { deepAssign } from "read-config-file/out/deepAssign"
import "source-map-support/register"
import { Configuration, Plugin, Rule } from "webpack"
import { configureTypescript } from "./configurators/ts"
import { configureVue } from "./configurators/vue/vue"
import { ConfigurationEnv, ConfigurationType, ElectronWebpackConfiguration, PackageMetadata, PartConfiguration } from "./core"
import { BaseTarget } from "./targets/BaseTarget"
import { MainTarget } from "./targets/MainTarget"
import { BaseRendererTarget, RendererTarget } from "./targets/RendererTarget"
import { getFirstExistingFile, normaliseErrorMessages, orNullIfFileNotExist } from "./util"

export { ElectronWebpackConfiguration } from "./core"

const _debug = require("debug")

export function getAppConfiguration(env: ConfigurationEnv) {
  return BluebirdPromise.filter([configure("main", env), configure("renderer", env)], it => it != null)
}

export function getMainConfiguration(env: ConfigurationEnv) {
  return configure("main", env)
}

export function getRendererConfiguration(env: ConfigurationEnv) {
  return configure("renderer", env)
}

// in the future, if need, isRenderer = true arg can be added
export function getDllConfiguration(env: ConfigurationEnv) {
  return configure("renderer-dll", env)
}

export async function getTestConfiguration(env: ConfigurationEnv) {
  return (await createConfigurator("test", env))
    .configure({
      testComponents: path.join(process.cwd(), "src/renderer/components/testComponents.ts"),
    })
}

export class WebpackConfigurator {
  readonly projectDir: string

  private electronVersionPromise = new Lazy(() => getInstalledElectronVersion(this.projectDir))

  readonly isRenderer: boolean
  readonly isProduction: boolean
  readonly isTest = this.type === "test"

  readonly sourceDir: string
  readonly commonSourceDirectory: string

  readonly debug = _debug(`electron-webpack:${this.type}`)

  config: Configuration

  readonly rules: Array<Rule> = []
  readonly plugins: Array<Plugin> = []

  // js must be first - e.g. iview has two files loading-bar.js and loading-bar.vue - when we require "loading-bar", js file must be resolved and not vue
  readonly extensions: Array<string> = [".js", ".json", ".node"]

  electronVersion: string

  readonly entryFiles: Array<string> = []

  constructor(readonly type: ConfigurationType, readonly env: ConfigurationEnv, readonly electronWebpackConfiguration: ElectronWebpackConfiguration, readonly metadata: PackageMetadata) {
    if (electronWebpackConfiguration.renderer === undefined) {
      electronWebpackConfiguration.renderer = {}
    }
    if (electronWebpackConfiguration.main === undefined) {
      electronWebpackConfiguration.main = {}
    }

    if (metadata.dependencies == null) {
      metadata.dependencies = {}
    }
    if (metadata.devDependencies == null) {
      metadata.devDependencies = {}
    }

    this.projectDir = electronWebpackConfiguration.projectDir || process.cwd()
    this.isRenderer = type.startsWith("renderer")
    process.env.BABEL_ENV = type

    this.isProduction = this.env.production == null ? process.env.NODE_ENV === "production" : this.env.production

    this.debug(`isProduction: ${this.isProduction}`)

    this.sourceDir = this.getSourceDirectory(this.type)!!

    const commonSourceDirectory = this.electronWebpackConfiguration.commonSourceDirectory
    this.commonSourceDirectory = commonSourceDirectory == null ? path.join(this.projectDir, "src", "common") : path.resolve(this.projectDir, commonSourceDirectory)
  }

  /**
   * Returns null if code processing for type is disabled.
   */
  getSourceDirectory(type: ConfigurationType): string | null {
    const part = this.getPartConfiguration(type)
    if (part === null || (part != null && part.sourceDirectory === null)) {
      // part or sourceDirectory is explicitly set to null
      return null
    }

    const result = part == null ? null : part.sourceDirectory
    if (result == null) {
      return path.join(this.projectDir, "src", type.startsWith("renderer") || type === "test" ? "renderer" : type)
    }
    else {
      return path.resolve(this.projectDir, result)
    }
  }

  getPartConfiguration(type: ConfigurationType): PartConfiguration | null | undefined {
    if (type === "main") {
      return this.electronWebpackConfiguration.main
    }
    else {
      return this.electronWebpackConfiguration.renderer
    }
  }

  get commonDistDirectory() {
    return path.join(this.projectDir, this.electronWebpackConfiguration.distDirectory || "dist")
  }

  hasDependency(name: string) {
    return name in this.metadata.dependencies || this.hasDevDependency(name)
  }

  hasDevDependency(name: string) {
    return name in this.metadata.devDependencies
  }

  async configure(entry?: { [key: string]: any } | null) {
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
          common: this.commonSourceDirectory,
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
    this.electronVersion = this.electronWebpackConfiguration.electronVersion || await this.electronVersionPromise.value || "1.7.5"
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
      this.entryFiles.push((await computeEntryFile(this.sourceDir, this.projectDir))!!)
      this.config.entry = {
        [this.type]: this.entryFiles,
      }

      if (this.type === "main" && this.electronWebpackConfiguration.main != null) {
        let extraEntries = this.electronWebpackConfiguration.main.extraEntries
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
    const whiteListedModules = new Set(this.electronWebpackConfiguration.whiteListedModules || [])
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
      externals.push("electron-webpack/out/electron-main-hmr/HmrClient")
      externals.push("source-map-support/source-map-support.js")
    }

    if (this.electronWebpackConfiguration.externals != null) {
      return externals.concat(this.electronWebpackConfiguration.externals)
    }

    return externals
  }
}

const validatorPromise = new Lazy(async () => {
  const ajv = new Ajv({allErrors: true, coerceTypes: true})
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"))
  require("ajv-keywords")(ajv, ["typeof"])
  const schema = await readJson(path.join(__dirname, "..", "scheme.json"))
  return ajv.compile(schema)
})

export async function createConfigurator(type: ConfigurationType, env: ConfigurationEnv | null) {
  if (env != null) {
    // allow to pass as `--env.autoClean=false` webpack arg
    const _env: any = env
    for (const name of ["minify", "autoClean", "production"]) {
      if (_env[name] === "true") {
        _env[name] = true
      }
      else if (_env[name] === "false") {
        _env[name] = false
      }
    }
  }

  if (env == null) {
     env = {}
   }

  const projectDir = (env.configuration || {}).projectDir || process.cwd()
  const packageMetadata = await orNullIfFileNotExist(readJson(path.join(projectDir, "package.json")))
  const electronWebpackConfig = await getConfig({
    packageKey: "electronWebpack",
    configFilename: "electron-webpack",
    projectDir,
    packageMetadata: new Lazy(() => BluebirdPromise.resolve(packageMetadata))
  })
  if (env.configuration != null) {
    deepAssign(electronWebpackConfig, env.configuration)
  }

  const validator = await validatorPromise.value
  if (!validator(electronWebpackConfig)) {
    throw new Error(`Configuration is invalid:
${JSON.stringify(normaliseErrorMessages(validator.errors!), null, 2)}

How to fix:
  1. Open https://webpack.electron.build/options
  2. Search the option name on the page.
    * Not found? The option was deprecated or not exists (check spelling).
    * Found? Check that the option in the appropriate place. e.g. "sourceDirectory" only in the "main" or "renderer", not in the root.
`)
  }

  return new WebpackConfigurator(type, env, electronWebpackConfig, packageMetadata)
}

export async function configure(type: ConfigurationType, env: ConfigurationEnv | null): Promise<Configuration | null> {
  const configurator = await createConfigurator(type, env)
  const sourceDir = configurator.sourceDir
  // explicitly set to null - do not handle at all and do not show info message
  if (sourceDir === null) {
    return null
  }
  else {
    return configurator.configure()
  }
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

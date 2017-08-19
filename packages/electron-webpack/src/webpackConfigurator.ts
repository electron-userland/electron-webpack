import Ajv, { AdditionalPropertiesParams, ErrorObject, TypeParams } from "ajv"
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
import { ConfigurationEnv, ConfigurationType, ElectronWebpackConfiguration, PackageMetadata } from "./core"
import { BaseTarget } from "./targets/BaseTarget"
import { MainTarget } from "./targets/MainTarget"
import { BaseRendererTarget, RendererTarget } from "./targets/RendererTarget"
import { getFirstExistingFile, orNullIfFileNotExist } from "./util"

const _debug = require("debug")

export class WebpackConfigurator {
  readonly projectDir: string

  private electronVersionPromise = new Lazy(() => getInstalledElectronVersion(this.projectDir))

  readonly isRenderer: boolean
  readonly isProduction: boolean
  readonly isTest = this.type === "test"

  readonly sourceDir: string
  readonly commonSourceDirectory: string

  metadata: PackageMetadata

  readonly debug = _debug(`electron-webpack:${this.type}`)

  config: Configuration

  readonly rules: Array<Rule> = []
  readonly plugins: Array<Plugin> = []

  // js must be first - e.g. iview has two files loading-bar.js and loading-bar.vue - when we require "loading-bar", js file must be resolved and not vue
  readonly extensions: Array<string> = [".js", ".json", ".node"]

  electronVersion: string

  readonly entryFiles: Array<string> = []

  constructor(readonly type: ConfigurationType, readonly env: ConfigurationEnv, readonly electronWebpackConfiguration: ElectronWebpackConfiguration) {
    if (electronWebpackConfiguration.renderer == null) {
      electronWebpackConfiguration.renderer = {}
    }
    if (electronWebpackConfiguration.main == null) {
      electronWebpackConfiguration.main = {}
    }

    this.projectDir = electronWebpackConfiguration.projectDir || process.cwd()
    this.isRenderer = type.startsWith("renderer")
    process.env.BABEL_ENV = type

    this.isProduction = this.env.production !== false && this.env.production !== "false" && (this.env.production === true || this.env.production === "true" || process.env.NODE_ENV === "production")
    this.debug(`isProduction: ${this.isProduction}`)

    this.sourceDir = this.getSourceDirectory(this.type)

    const commonSourceDirectory = this.electronWebpackConfiguration.commonSourceDirectory
    this.commonSourceDirectory = commonSourceDirectory == null ? path.join(this.projectDir, "src", "common") : path.resolve(this.projectDir, commonSourceDirectory)
  }

  getSourceDirectory(type: ConfigurationType) {
    const isRenderer = type.startsWith("renderer") || type === "test"
    let result: string | null | undefined
    if (isRenderer) {
      result = this.electronWebpackConfiguration.renderer!!.sourceDirectory
    }
    else if (type === "main") {
      result = this.electronWebpackConfiguration.main!!.sourceDirectory
    }

    if (result != null) {
      return path.resolve(this.projectDir, result)
    }
    return path.join(this.projectDir, "src", isRenderer ? "renderer" : type)
  }

  get commonDistDirectory() {
    return path.join(this.projectDir, "dist")
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
      this.entryFiles.push(projectInfo[1]!!)
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
      externals.push("electron-webpack/electron-main-hmr/HmrClient")
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
  if (env == null) {
    env = {}
  }

  const projectDir = (env.configuration || {}).projectDir || process.cwd()
  const electronWebpackConfig = await getConfig({
    packageKey: "electronWebpack",
    configFilename: "electron-webpack",
    projectDir,
    packageMetadata: new Lazy(() => orNullIfFileNotExist(readJson(path.join(projectDir, "package.json"))))
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

  return new WebpackConfigurator(type, env, electronWebpackConfig)
}

export async function configure(type: ConfigurationType, env: ConfigurationEnv | null) {
  return (await createConfigurator(type, env)).configure()
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

function normaliseErrorMessages(errors: Array<ErrorObject>) {
  const result: any = Object.create(null)
  for (const e of errors) {
    if (e.keyword === "type" && (e.params as TypeParams).type === "null") {
      // ignore - no sense to report that type accepts null
      continue
    }

    const dataPath = e.dataPath.length === 0 ? [] : e.dataPath.substring(1).split(".")
    if (e.keyword === "additionalProperties") {
      dataPath.push((e.params as AdditionalPropertiesParams).additionalProperty)
    }

    let o = result
    let lastName: string | null = null
    for (const p of dataPath) {
      if (p === dataPath[dataPath.length - 1]) {
        lastName = p
        break
      }
      else {
        if (o[p] == null) {
          o[p] = Object.create(null)
        }
        else if (typeof o[p] === "string") {
          o[p] = [o[p]]
        }
        o = o[p]
      }
    }

    if (lastName == null) {
      lastName = "unknown"
    }

    let message = e.message!.toUpperCase()[0] + e.message!.substring(1)
    switch (e.keyword) {
      case "additionalProperties":
        message = "Unknown option"
        break

      case "required":
        message = "Required option"
        break

      case "anyOf":
        message = "Invalid option object"
        break
    }

    if (o[lastName] != null && !Array.isArray(o[lastName])) {
      o[lastName] = [o[lastName]]
    }

    if (Array.isArray(o[lastName])) {
      o[lastName].push(message)
    }
    else {
      o[lastName] = message
    }
  }
  return result
}
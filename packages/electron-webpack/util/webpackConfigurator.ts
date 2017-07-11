import BluebirdPromise from "bluebird-lst"
import { readJson, stat } from "fs-extra-p"
import * as path from "path"
import { gte } from "semver"
import "source-map-support/register"
import { Configuration, DefinePlugin, HotModuleReplacementPlugin, LoaderOptionsPlugin, NamedModulesPlugin, NewModule, NoEmitOnErrorsPlugin, optimize } from "webpack"
import { getBaseRendererConfig } from "./base.renderer.config"
import { Lazy, PackageMetadata, WebpackRemoveOldAssetsPlugin } from "./util"

const projectDir = process.cwd()

const _debug = require("debug")

interface ConfigEnv {
  production?: boolean | "true" | "false"
  autoClean?: boolean
}

const electronVersionPromise = new Lazy(() => getInstalledElectronVersion())

export async function configure(type: "main" | "renderer" | "test", env: ConfigEnv | null, entry?: { [key: string]: any } | null) {
  process.env.BABEL_ENV = type

  const debug = _debug(`electron-webpack:${type}`)

  if (env == null) {
    env = {}
  }

  const isTest = type === "test"
  const isProduction = env.production !== false && env.production !== "false" && (env.production === true || env.production === "true" || process.env.NODE_ENV === "production")
  const isDevBuild = isTest || !isProduction

  debug(`isProduction: ${isProduction}`)

  const srcDir = path.join(projectDir, "src", type === "test" ? "renderer" : type)
  const projectInfo = await BluebirdPromise.all([readJson(path.join(projectDir, "package.json")), entry == null ? computeEntryFile(srcDir) : BluebirdPromise.resolve()])
  const metadata: PackageMetadata = projectInfo[0]
  if (metadata.dependencies == null) {
    metadata.dependencies = {}
  }
  if (metadata.devDependencies == null) {
    metadata.devDependencies = {}
  }

  const config: Configuration = type === "main" ? {} : getBaseRendererConfig(metadata, projectDir, isProduction, isTest)

  const electronVueConfig = metadata.electronWebpack || {}

  const electronVersion = electronVueConfig.electronVersion || await electronVersionPromise.value

  const whiteListedModules = new Set<string>(electronVueConfig.whiteListedModules || [])
  if (type === "renderer") {
    whiteListedModules.add("vue")
  }

  Object.assign(config, {
    context: projectDir,
    devtool: isProduction || isTest ? "nosources-source-map" : "eval-source-map",
    externals: computeExternals(whiteListedModules, metadata),
    node: {
      __dirname: !isProduction,
      __filename: !isProduction,
    },
    output: {
      filename: "[name].js",
      libraryTarget: "commonjs2",
      path: path.join(projectDir, "dist", type)
    },
    target: isTest ? "node" : `electron-${type}`,
  })

  if (config.entry == null) {
    config.entry = entry || {
      [type]: projectInfo[1],
    }
  }

  const plugins = getPlugins(config)

  if (config.module == null) {
    config.module = {rules: []}
  }

  const extensions = getExtensions(config)
  const rules = (config.module as NewModule).rules

  const hasTsChecker = "fork-ts-checker-webpack-plugin" in metadata.devDependencies
  if (hasTsChecker || "electron-webpack-ts" in metadata.devDependencies || "ts-loader" in metadata.devDependencies) {
    extensions.splice(1, 0, ".ts")

    // no sense to use fork-ts-checker-webpack-plugin for production build
    if (hasTsChecker && !isProduction && !isTest) {
      const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")
      plugins.push(new ForkTsCheckerWebpackPlugin({tsconfig: path.join(srcDir, "tsconfig.json")}))
    }

    rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "ts-loader",
          options: {
            // use transpileOnly mode to speed-up compilation
            // in the test mode also, because checked during dev or production build
            transpileOnly: isDevBuild,
            appendTsSuffixTo: [/\.vue$/],
          }
        },
      ],
    })
  }

  const babelLoader = {
    loader: "babel-loader",
    options: {
      presets: [
        ["env", {
          modules: false,
          targets: computeBabelEnvTarget(type === "renderer", electronVersion),
        }],
      ]
    }
  }

  if (type !== "main" && ("iview" in metadata.devDependencies || "iview" in metadata.dependencies)) {
    rules.push({
      test: /iview.src.*?js$/,
      use: babelLoader
    })
  }

  rules.push({
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    use: babelLoader
  })

  rules.push({
    test: /\.node$/,
    use: "node-loader"
  })

  // https://github.com/webpack/webpack-dev-server/issues/949
  if (isProduction || type !== "renderer") {
    debug("Add ModuleConcatenationPlugin")
    plugins.push(new optimize.ModuleConcatenationPlugin())
  }

  if (isProduction) {
    const BabiliWebpackPlugin = require("babili-webpack-plugin")
    plugins.push(new BabiliWebpackPlugin({
      // removeConsole: true,
      removeDebugger: true
    }))
    plugins.push(new DefinePlugin({
      "process.env.NODE_ENV": '"production"'
    }))
    plugins.push(new LoaderOptionsPlugin({minimize: true}))
  }
  else {
    plugins.push(new DefinePlugin({
      __static: `"${path.join(projectDir, "static").replace(/\\/g, "\\\\")}"`
    }))

    if (debug.enabled) {
      debug("Add HotModuleReplacementPlugin")
    }
    plugins.push(new HotModuleReplacementPlugin())
  }

  if (!isProduction) {
    plugins.push(new NamedModulesPlugin())
  }
  plugins.push(new NoEmitOnErrorsPlugin())

  if (env.autoClean !== false) {
    debug("Add WebpackRemoveOldAssetsPlugin")
    plugins.push(new WebpackRemoveOldAssetsPlugin())
  }

  if (debug.enabled) {
    debug(`\n\n${type} config:` + JSON.stringify(config, null, 2) + "\n\n")
  }
  return config
}

function computeBabelEnvTarget(isRenderer: boolean, electronVersion: string) {
  if (isRenderer) {
    return {
      electron: electronVersion
    }
  }

  // https://github.com/electron/electron/blob/1-6-x/.node-version
  let nodeVersion = "7.4.0"
  if (gte(electronVersion, "1.7.3")) {
    // https://github.com/electron/electron/blob/master/.node-version
    nodeVersion = "7.9.0"
  }

  return {
    node: nodeVersion
  }
}

async function computeEntryFile(srcDir: string) {
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

function computeExternals(whiteListedModules: Set<string> | any, packageData: any) {
  let externals: Array<string> = []
  const filter = (name: string) => !name.startsWith("@types/") && (whiteListedModules == null || !whiteListedModules.has(name))
  if (packageData.dependencies != null) {
    externals = Object.keys(packageData.dependencies).filter(filter).concat(externals)
  }
  if (packageData.devDependencies != null) {
    externals = Object.keys(packageData.devDependencies).filter(filter).concat(externals)
  }
  externals.push("electron")
  return externals
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

async function getInstalledElectronVersion() {
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
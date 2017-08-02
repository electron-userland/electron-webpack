import * as path from "path"
import { DefinePlugin, HotModuleReplacementPlugin, LoaderOptionsPlugin, NamedModulesPlugin, NoEmitOnErrorsPlugin, optimize } from "webpack"
import { configureDll } from "../configurators/dll"
import { createBabelLoader } from "../configurators/js"
import { WatchFilterPlugin } from "../plugins/WatchMatchPlugin"
import { WebpackRemoveOldAssetsPlugin } from "../plugins/WebpackRemoveOldAssetsPlugin"
import { WebpackConfigurator } from "../webpackConfigurator"

export class BaseTarget {
  configureRules(configurator: WebpackConfigurator): void {
    const rules = configurator.rules

    const babelLoader = createBabelLoader(configurator)
    if (configurator.type !== "main" && configurator.hasDependency("iview")) {
      rules.push({
        test: /iview.src.*?js$/,
        use: babelLoader
      })
    }

    rules.push(
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: babelLoader
      },
      {
        test: /\.node$/,
        use: "node-loader"
      },
    )
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    const plugins = configurator.plugins
    const debug = configurator.debug

    if (configurator.isProduction) {
      if (configurator.env.noMinimize !== true) {
        const BabiliWebpackPlugin = require("babili-webpack-plugin")
        plugins.push(new BabiliWebpackPlugin({
          // removeConsole: true,
          removeDebugger: true
        }))
      }
      plugins.push(new DefinePlugin({
        "process.env.NODE_ENV": "\"production\""
      }))
      plugins.push(new LoaderOptionsPlugin({minimize: true}))
    }
    else {
      plugins.push(new NamedModulesPlugin())
      plugins.push(new DefinePlugin({
        __static: `"${path.join(configurator.projectDir, "static").replace(/\\/g, "\\\\")}"`
      }))

      if (debug.enabled) {
        debug("Add HotModuleReplacementPlugin")
      }
      plugins.push(new HotModuleReplacementPlugin())
    }

    const dllManifest = await configureDll(configurator)

    // do not use ModuleConcatenationPlugin for HMR
    // https://github.com/webpack/webpack-dev-server/issues/949
    if (configurator.isProduction) {
      plugins.push(new optimize.ModuleConcatenationPlugin())
    }

    if (configurator.env.autoClean !== false) {
      debug("Add WebpackRemoveOldAssetsPlugin")
      plugins.push(new WebpackRemoveOldAssetsPlugin(dllManifest))
    }

    if (!configurator.isProduction) {
      if (configurator.hasDevDependency("webpack-build-notifier")) {
        const WebpackNotifierPlugin = require("webpack-build-notifier")
        plugins.push(new WebpackNotifierPlugin({
          title: `Webpack - ${configurator.type}`,
          suppressSuccess: "initial",
          sound: false,
        }))
      }

      if (configurator.hasDevDependency("webpack-notifier")) {
        const WebpackNotifierPlugin = require("webpack-notifier")
        plugins.push(new WebpackNotifierPlugin({title: `Webpack - ${configurator.type}`}))
      }

      const watchIgnore = [
        configurator.commonDistDirectory,
        path.join(configurator.projectDir, "build"),
        path.join(configurator.projectDir, "dist"),
        path.join(configurator.projectDir, "node_modules"),
        path.join(configurator.projectDir, "static"),
        path.join(configurator.projectDir, ".idea"),
        path.join(configurator.projectDir, ".vscode"),
        configurator.getSourceDirectory(configurator.type === "main" ? "renderer" : "main")
      ]

      if (configurator.type !== "test") {
        watchIgnore.push(path.join(configurator.projectDir, "test"))
      }

      if (debug.enabled) {
        debug(`Watch ignore: ${watchIgnore.join(", ")}`)
      }

      // watch common code
      const commonSourceDir = configurator.commonSourceDirectory
      const alienSourceDir = configurator.getSourceDirectory(configurator.type === "main" ? "renderer" : "main")

      configurator.plugins.push(new WatchFilterPlugin(file => {
        return file === commonSourceDir || (isAncestor(file, commonSourceDir) && !file.startsWith(alienSourceDir))
      }, require("debug")(`electron-webpack:watch-${configurator.type}`)))
    }

    plugins.push(new NoEmitOnErrorsPlugin())
  }
}

function isAncestor(file: string, dir: string) {
  return file.length > dir.length && file[dir.length] === path.sep && file.startsWith(dir)
}
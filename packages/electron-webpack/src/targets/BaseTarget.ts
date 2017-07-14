import * as path from "path"
import { DefinePlugin, HotModuleReplacementPlugin, LoaderOptionsPlugin, NamedModulesPlugin, NoEmitOnErrorsPlugin, optimize } from "webpack"
import { configureDll } from "../configurators/dll"
import { computeBabelEnvTarget } from "../configurators/js"
import { WebpackRemoveOldAssetsPlugin } from "../util"
import { WebpackConfigurator } from "../webpackConfigurator"

export class BaseTarget {
  configureRules(configurator: WebpackConfigurator): void {
    const rules = configurator.rules

    const babelLoader = {
      loader: "babel-loader",
      options: {
        presets: [
          ["env", {
            modules: false,
            targets: computeBabelEnvTarget(configurator.isRenderer, configurator.electronVersion),
          }],
        ]
      }
    }

    if (configurator.type !== "main" && ("iview" in configurator.metadata.devDependencies || "iview" in configurator.metadata.dependencies)) {
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

    if ((configurator.isTest || configurator.isRenderer) && Object.keys(configurator.config.entry).length > 1) {
      plugins.push(new optimize.CommonsChunkPlugin({
        name: "common",
      }))
    }

    const dllManifest = await configureDll(configurator)
    // https://github.com/webpack/webpack-dev-server/issues/949
    // https://github.com/webpack/webpack/issues/5095#issuecomment-314813438
    if (!configurator.type.endsWith("-dll") && (configurator.isProduction || !configurator.isRenderer)) {
      debug("Add ModuleConcatenationPlugin")
      plugins.push(new optimize.ModuleConcatenationPlugin())
    }

    if (configurator.env.autoClean !== false) {
      debug("Add WebpackRemoveOldAssetsPlugin")
      plugins.push(new WebpackRemoveOldAssetsPlugin(dllManifest))
    }

    plugins.push(new NoEmitOnErrorsPlugin())
  }
}
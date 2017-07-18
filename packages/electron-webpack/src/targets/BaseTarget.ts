import * as path from "path"
import { BannerPlugin, DefinePlugin, HotModuleReplacementPlugin, LoaderOptionsPlugin, NamedModulesPlugin, NoEmitOnErrorsPlugin, optimize } from "webpack"
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

    // do not add for main dev (to avoid adding to hot update chunks), our main-hmr install it
    if ((configurator.isProduction || configurator.type !== "main") && ("source-map-support" in configurator.metadata.dependencies || (configurator.isRenderer && "source-map-support" in configurator.metadata.devDependencies))) {
      plugins.push(new BannerPlugin({
        banner: 'require("source-map-support/source-map-support.js").install();',
        test: /\.js$/,
        raw: true,
        entryOnly: true,
      }))
    }

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
    if (configurator.isProduction && !configurator.type.endsWith("-dll")) {
      debug("Add ModuleConcatenationPlugin")
      plugins.push(new optimize.ModuleConcatenationPlugin())
    }

    if (configurator.env.autoClean !== false) {
      debug("Add WebpackRemoveOldAssetsPlugin")
      plugins.push(new WebpackRemoveOldAssetsPlugin(dllManifest))
    }

    if (!configurator.isProduction) {
      if ("webpack-build-notifier" in configurator.metadata.devDependencies) {
        const WebpackNotifierPlugin = require("webpack-build-notifier")
        plugins.push(new WebpackNotifierPlugin({
          title: `Webpack - ${configurator.type}`,
          suppressSuccess: true,
          sound: false,
        }))
      }

      if ("webpack-notifier" in configurator.metadata.devDependencies) {
        const WebpackNotifierPlugin = require("webpack-notifier")
        plugins.push(new WebpackNotifierPlugin({title: `Webpack - ${configurator.type}`}))
      }
    }

    plugins.push(new NoEmitOnErrorsPlugin())
  }
}
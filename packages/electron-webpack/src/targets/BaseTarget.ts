import * as path from "path"
import { DefinePlugin, EnvironmentPlugin, HotModuleReplacementPlugin, LoaderOptionsPlugin } from "webpack"
import { configureDll } from "../configurators/dll"
import { configureEslint } from "../configurators/eslint"
import { createBabelLoader } from "../configurators/js"
import { WebpackConfigurator } from "../main"
import { WatchFilterPlugin } from "../plugins/WatchMatchPlugin"
import { WebpackRemoveOldAssetsPlugin } from "../plugins/WebpackRemoveOldAssetsPlugin"

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

    if (configurator.hasDevDependency("nunjucks-loader")) {
      rules.push({
        test: /\.(njk|nunjucks)$/,
        loader: "nunjucks-loader"
      })
    }

    configureEslint(configurator)
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    const plugins = configurator.plugins

    const dllManifest = await configureDll(configurator)
    const mode = configurator.isProduction ? "production" : "development"

    let optimization = configurator.config.optimization
    if (optimization == null) {
      optimization = {}
      configurator.config.optimization = optimization
    }

    optimization.nodeEnv = mode
    configurator.config.mode = mode

    if (configurator.isProduction) {
      if (configurator.env.minify !== false) {
        const TerserPlugin = require("terser-webpack-plugin")
        optimization.minimizer = [new TerserPlugin({
          parallel: true,
          sourceMap: true,
        })]
      }
      optimization.minimize = true
      plugins.push(new LoaderOptionsPlugin({minimize: true}))

      // do not use ModuleConcatenationPlugin for HMR
      // https://github.com/webpack/webpack-dev-server/issues/949
      optimization.concatenateModules = true
    }
    else {
      configureDevelopmentPlugins(configurator)
    }

    if (configurator.env.autoClean !== false) {
      plugins.push(new WebpackRemoveOldAssetsPlugin(dllManifest))
    }

    optimization.noEmitOnErrors = true

    const additionalEnvironmentVariables = Object.keys(process.env).filter(it => it.startsWith("ELECTRON_WEBPACK_"))
    if (additionalEnvironmentVariables.length > 0) {
      plugins.push(new EnvironmentPlugin(additionalEnvironmentVariables))
    }
  }
}

export function configureFileLoader(prefix: string, limit = 10 * 1024) {
  return {
    limit,
    name: `${prefix}/[name]--[folder].[ext]`
  }
}

function isAncestor(file: string, dir: string) {
  return file.length > dir.length && file[dir.length] === path.sep && file.startsWith(dir)
}

function configureDevelopmentPlugins(configurator: WebpackConfigurator) {
  const plugins = configurator.plugins
  configurator.config.optimization!!.namedModules = true
  plugins.push(new DefinePlugin({
    __static: `"${path.join(configurator.projectDir, "static").replace(/\\/g, "\\\\")}"`
  }))

  plugins.push(new HotModuleReplacementPlugin())

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

  // watch common code
  let commonSourceDir: string
  if (!configurator.electronWebpackConfiguration.commonSourceDirectory) {
    // not src/common, because it is convenient to just put some code into src to use it
    commonSourceDir = path.join(configurator.projectDir, "src")
  } else {
    commonSourceDir = configurator.commonSourceDirectory
  }

  const alienSourceDir = configurator.getSourceDirectory(configurator.type === "main" ? "renderer" : "main")

  configurator.plugins.push(new WatchFilterPlugin(file => {
    return file === commonSourceDir || (isAncestor(file, commonSourceDir!!) && (alienSourceDir != null && !file.startsWith(alienSourceDir)))
  }, require("debug")(`electron-webpack:watch-${configurator.type}`)))
}

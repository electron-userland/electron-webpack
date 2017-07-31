import * as path from "path"
import { DefinePlugin } from "webpack"
import { WebpackConfigurator } from "../webpackConfigurator"
import { BaseTarget } from "./BaseTarget"

const HtmlWebpackPlugin = require("html-webpack-plugin")
const ExtractTextPlugin = require("extract-text-webpack-plugin")

export class BaseRendererTarget extends BaseTarget {
  constructor() {
    super()
  }

  configureRules(configurator: WebpackConfigurator): void {
    super.configureRules(configurator)

    configurator.extensions.push(".css")

    function configureFileLoader(prefix: string) {
      return {
        limit: 10000,
        name: `${prefix}/[name].[ext]`
      }
    }

    configurator.rules.push(
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: "css-loader",
          fallback: "style-loader",
        }),
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          use: [
            {loader: "css-loader"},
            {loader: "less-loader"}
          ],
          fallback: "style-loader"
        })
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: configureFileLoader("imgs")
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: configureFileLoader("fonts")
        }
      },
    )
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    configurator.debug("Add ExtractTextPlugin plugin")
    configurator.plugins.push(new ExtractTextPlugin(`${configurator.type === "renderer-dll" ? "vendor" : "styles"}.css`))

    // https://github.com/electron-userland/electrify/issues/1
    if (!configurator.isProduction) {
      configurator.plugins.push(new DefinePlugin({
        "process.env.NODE_ENV": "\"development\""
      }))
    }

    await BaseTarget.prototype.configurePlugins.call(this, configurator)
  }
}

export class RendererTarget extends BaseRendererTarget {
  constructor() {
    super()
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    const plugins = configurator.plugins
    plugins.push(new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(configurator.commonSourceDirectory, "index.ejs"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: configurator.isProduction ? false : path.resolve(configurator.projectDir, "node_modules")
    }))

    if (!configurator.isProduction) {
      const contentBase = [path.join(configurator.projectDir, "static"), path.join(configurator.commonDistDirectory, "renderer-dll")]
      configurator.config.devServer = {
        contentBase,
        port: 9080,
        hot: true,
        overlay: true,
      }
    }

    await BaseRendererTarget.prototype.configurePlugins.call(this, configurator)
  }
}
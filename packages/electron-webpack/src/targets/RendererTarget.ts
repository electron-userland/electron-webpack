import * as path from "path"
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
          query: {
            limit: 10000,
            name: "imgs/[name].[ext]"
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: {
            limit: 10000,
            name: "fonts/[name].[ext]"
          }
        }
      },
    )
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    configurator.debug("Add ExtractTextPlugin plugin")
    configurator.plugins.push(new ExtractTextPlugin(`${configurator.type === "renderer-dll" ? "vendor" : "styles"}.css`))

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
      template: path.resolve(configurator.projectDir, "src/index.ejs"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: configurator.isProduction ? false : path.resolve(configurator.projectDir, "node_modules")
    }))

    if (!configurator.isProduction) {
      configurator.config.devServer = {
        contentBase: configurator.projectDir,
        port: 9080,
        hot: true,
        overlay: true,
      }
    }

    await BaseRendererTarget.prototype.configurePlugins.call(this, configurator)
  }
}
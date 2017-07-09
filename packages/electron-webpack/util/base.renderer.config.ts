import * as path from "path"
import { Configuration } from "webpack"
import { PackageMetadata } from "./util"

const ExtractTextPlugin = require("extract-text-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

export function getBaseRendererConfig(metadata: PackageMetadata, projectDir: string, isProduction: boolean, isTest: boolean): Configuration {
  const hasVue = "vue" in metadata.dependencies
  const rules = [
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
  ]

  if (hasVue) {
    rules.push(
      {
        test: /\.html$/,
        use: "vue-html-loader"
      },
      {
        test: /\.vue$/,
        use: {
          loader: "vue-loader",
          options: {
            extractCSS: isProduction,
            loaders: {
              sass: "vue-style-loader!css-loader!sass-loader?indentedSyntax=1",
              scss: "vue-style-loader!css-loader!sass-loader",
            }
          }
        }
      },
    )
  }

  rules.push(
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

  const config = {
    module: {rules},
    plugins: [
      new ExtractTextPlugin("styles.css"),
    ],
    resolve: {
      alias: {
        "@": path.join(projectDir, "src/renderer"),
        vue$: "vue/dist/vue.esm.js"
      },
      extensions: [".vue", ".css"]
    },
  }

  if (!isTest) {
    config.plugins.push(new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.resolve(projectDir, "src/index.ejs"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: isProduction ? false : path.resolve(projectDir, "node_modules")
    }))
  }

  return config
}
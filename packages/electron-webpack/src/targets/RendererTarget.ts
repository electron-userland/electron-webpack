import { Lazy } from "lazy-val"
import * as path from "path"
import { getConfig } from "read-config-file"
import { DefinePlugin } from "webpack"
import { getDllAssets } from "../configurators/dll"
import { statOrNull } from "../util"
import { WebpackConfigurator } from "../webpackConfigurator"
import { BaseTarget } from "./BaseTarget"

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

    if (configurator.hasDevDependency("ejs-html-loader")) {
      configurator.rules.push({
        test: /\.ejs$/,
        loader: "ejs-html-loader",
      })
    }
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    configurator.debug("Add ExtractTextPlugin plugin")
    configurator.plugins.push(new ExtractTextPlugin(`${configurator.type === "renderer-dll" ? "vendor" : "styles"}.css`))

    // https://github.com/electron-userland/electrify/issues/1
    if (!configurator.isProduction) {
      configurator.plugins.push(new DefinePlugin({
        "process.env.NODE_ENV": "\"development\"",
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
    const customTemplateFile = path.join(configurator.commonSourceDirectory, "index.ejs")
    const HtmlWebpackPlugin = require("html-webpack-plugin")
    const nodeModulePath = configurator.isProduction ? null : path.resolve(configurator.projectDir, "node_modules")

    configurator.plugins.push(new HtmlWebpackPlugin({
      filename: "index.html",
      template: (await statOrNull(customTemplateFile)) == null ? (await generateIndexFile(configurator, nodeModulePath)) : customTemplateFile,
      minify: false,
      nodeModules: nodeModulePath
    }))

    if (configurator.isProduction) {
      configurator.plugins.push(new DefinePlugin({
        __static: `"${path.join(configurator.projectDir, "static").replace(/\\/g, "\\\\")}"`
      }))
    }
    else {
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

async function computeTitle(configurator: WebpackConfigurator): Promise<string | null | undefined> {
  const titleFromOptions = configurator.electronWebpackConfig.title
  if (titleFromOptions == null || titleFromOptions === false) {
    return null
  }

  if (titleFromOptions !== true) {
    return titleFromOptions
  }

  let title: string | null | undefined = (configurator.metadata as any).productName
  if (title == null) {
    const electronBuilderConfig = await getConfig<any>({
      packageKey: "build",
      configFilename: "electron-builder",
      projectDir: configurator.projectDir,
      packageMetadata: new Lazy(() => Promise.resolve(configurator.metadata))
    })
    if (electronBuilderConfig != null) {
      title = electronBuilderConfig.productName
    }
  }

  if (title == null) {
    title = configurator.metadata.name
  }
  return title
}

async function generateIndexFile(configurator: WebpackConfigurator, nodeModulePath: string | null) {
  // do not use add-asset-html-webpack-plugin - no need to copy vendor files to output (in dev mode will be served directly, in production copied)
  const assets = await getDllAssets(path.join(configurator.commonDistDirectory, "renderer-dll"), configurator)
  const scripts: Array<string> = []
  const css: Array<string> = []
  for (const asset of assets) {
    if (asset.endsWith(".js")) {
      scripts.push(`<script type="text/javascript" src="${asset}"></script>`)
    }
    else {
      css.push(`<link rel="stylesheet" href="${asset}">`)
    }
  }

  const virtualFilePath = "/__virtual__/renderer-index.html"

  const title = await computeTitle(configurator)

  // add node_modules to global paths so "require" works properly in development
  const VirtualModulePlugin = require("virtual-module-webpack-plugin")
  configurator.plugins.push(new VirtualModulePlugin({
    moduleName: virtualFilePath,
    contents: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    ${title == null ? "" : `<title>${title}</title>`}
    <script>
      ${nodeModulePath == null ? "" : `require("module").globalPaths.push("${nodeModulePath.replace(/\\/g, "\\\\")}")`}
      require("source-map-support/source-map-support.js").install()
    </script>
    ${scripts.join("")}
  ${css.join("")}
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`,
  }))

  return `!!html-loader?minimize=false!${virtualFilePath}`
}
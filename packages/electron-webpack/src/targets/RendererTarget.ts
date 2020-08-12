import { outputFile, readFile } from "fs-extra"
import { Lazy } from "lazy-val"
import * as path from "path"
import { getConfig } from "read-config-file"
import { DefinePlugin } from "webpack"
import { getDllAssets } from "../configurators/dll"
import { configureVueRenderer } from "../configurators/vue/vue"
import { WebpackConfigurator } from "../main"
import { statOrNull } from "../util"
import { BaseTarget, configureFileLoader } from "./BaseTarget"

const MiniCssExtractPlugin = require("mini-css-extract-plugin")

export class BaseRendererTarget extends BaseTarget {
  constructor() {
    super()
  }

  configureRules(configurator: WebpackConfigurator): void {
    super.configureRules(configurator)

    configurator.extensions.push(".css")

    const miniLoaders = [MiniCssExtractPlugin.loader, { loader: "css-loader", options: { modules: "global" } }]
    const cssHotLoader = configurator.isProduction ? miniLoaders : ["css-hot-loader"].concat(miniLoaders)
    if (!configurator.isProduction) {
      // https://github.com/shepherdwind/css-hot-loader/issues/37
      configurator.entryFiles.unshift("css-hot-loader/hotModuleReplacement")
    }

    configurator.rules.push(
      {
        test: /\.css$/,
        use: cssHotLoader,
      },
      {
        test: /\.less$/,
        use: cssHotLoader.concat("less-loader"),
      },
      {
        test: /\.s([ac])ss$/,
        use: cssHotLoader.concat("sass-loader"),
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: "url-loader",
          options: configureFileLoader("imgs")
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: "url-loader",
        options: configureFileLoader("media"),
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: "url-loader",
          options: configureFileLoader("fonts")
        }
      },
    )

    if (configurator.hasDevDependency("ejs-html-loader")) {
      configurator.rules.push({
        test: /\.ejs$/,
        loader: "ejs-html-loader",
      })
    }

    if (configurator.hasDependency("vue")) {
      configureVueRenderer(configurator)
    }
    else {
      configurator.rules.push({
        test: /\.(html)$/,
        use: {
          loader: "html-loader",
        }
      })
    }
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    configurator.debug("Add ExtractTextPlugin plugin")
    configurator.plugins.push(new MiniCssExtractPlugin({filename: `${configurator.type === "renderer-dll" ? "vendor" : "styles"}.css`}))

    await BaseTarget.prototype.configurePlugins.call(this, configurator)
  }
}

export class RendererTarget extends BaseRendererTarget {
  constructor() {
    super()
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    // not configurable for now, as in the electron-vue
    const customTemplateFile = path.join(configurator.projectDir, configurator.rendererTemplate)
    const HtmlWebpackPlugin = require("html-webpack-plugin")
    const nodeModulePath = configurator.isProduction ? null : path.resolve(require.resolve("electron"), "..", "..")

    let template
    if (await statOrNull(customTemplateFile)) {
      template = await readFile(customTemplateFile, {encoding: "utf8"})
    }
    else {
      template = getDefaultIndexTemplate()
    }

    configurator.plugins.push(new HtmlWebpackPlugin({
      filename: "index.html",
      template: await generateIndexFile(configurator, nodeModulePath, template),
      minify: false,
      nodeModules: nodeModulePath
    }))

    if (configurator.isProduction) {
      configurator.plugins.push(new DefinePlugin({
        __static: `process.resourcesPath + "/${configurator.staticSourceDirectory}"`
      }))
    }
    else {
      const contentBase = [path.join(configurator.projectDir, configurator.staticSourceDirectory), path.join(configurator.commonDistDirectory, "renderer-dll")];
      (configurator.config as any).devServer = {
        contentBase,
        host: process.env.ELECTRON_WEBPACK_WDS_HOST || "localhost",
        port: process.env.ELECTRON_WEBPACK_WDS_PORT || 9080,
        hot: true,
        overlay: true,
      }
    }

    await BaseRendererTarget.prototype.configurePlugins.call(this, configurator)
  }
}

async function computeTitle(configurator: WebpackConfigurator): Promise<string | null | undefined> {
  const titleFromOptions = configurator.electronWebpackConfiguration.title
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
      title = electronBuilderConfig.result.productName
    }
  }

  if (title == null) {
    title = configurator.metadata.name
  }
  return title
}

function getDefaultIndexTemplate() {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>`
}

async function generateIndexFile(configurator: WebpackConfigurator, nodeModulePath: string | null, template: string) {
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

  const title = await computeTitle(configurator)
  const filePath = path.join(configurator.commonDistDirectory, ".renderer-index-template.html")

  let html = template
  if (title) {
    html = html.replace("</head>", `<title>${title}</title></head>`)
  }

  if (nodeModulePath) {
    html = html.replace("</head>", `<script>require('module').globalPaths.push("${nodeModulePath.replace(/\\/g, "/")}")</script></head>`)
  }

  if (!process.env.ELECTRON_WEBPACK_DISABLE_SOURCE_MAP_SUPPORT) {
    html = html.replace("</head>", '<script>require("source-map-support/source-map-support.js").install()</script></head>');
  }

  if (scripts.length) {
    html = html.replace("</head>", `${scripts.join("")}</head>`)
  }

  if (css.length) {
    html = html.replace("</head>", `${css.join("")}</head>`)
  }

  await outputFile(filePath, html)

  return `!!html-loader?minimize=false!${filePath}`
}

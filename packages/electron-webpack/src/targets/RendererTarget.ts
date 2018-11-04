import { outputFile } from "fs-extra-p"
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

    const miniLoaders = [MiniCssExtractPlugin.loader, "css-loader"]
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
        test: /\.scss/,
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
    // not configurable for now, as in the electron-vue
    const customTemplateFile = path.join(configurator.projectDir, "src/index.ejs")
    const HtmlWebpackPlugin = require("html-webpack-plugin")
    const nodeModulePath = configurator.isProduction ? null : path.resolve(require.resolve("electron"), "..", "..")

    configurator.plugins.push(new HtmlWebpackPlugin({
      filename: "index.html",
      template: (await statOrNull(customTemplateFile)) == null ? (await generateIndexFile(configurator, nodeModulePath)) : customTemplateFile,
      minify: false,
      nodeModules: nodeModulePath
    }))

    if (configurator.isProduction) {
      configurator.plugins.push(new DefinePlugin({
        __static: `process.resourcesPath + "/static"`
      }))
    }
    else {
      const contentBase = [path.join(configurator.projectDir, "static"), path.join(configurator.commonDistDirectory, "renderer-dll")];
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

  const title = await computeTitle(configurator)
  const filePath = path.join(configurator.commonDistDirectory, ".renderer-index-template.html")
  await outputFile(filePath, `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    ${title == null ? "" : `<title>${title}</title>`}
    <script>
      ${nodeModulePath == null ? "" : `require("module").globalPaths.push("${nodeModulePath.replace(/\\/g, "/")}")`}
      require("source-map-support/source-map-support.js").install()
    </script>
    ${scripts.join("")}
  ${css.join("")}
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`)

  return `!!html-loader?minimize=false&url=false!${filePath}`
}

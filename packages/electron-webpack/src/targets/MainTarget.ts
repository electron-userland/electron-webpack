import * as path from "path"
import { BannerPlugin, DefinePlugin } from "webpack"
import { WebpackConfigurator } from "../main"
import { getFirstExistingFile } from "../util"
import { BaseTarget, configureFileLoader } from "./BaseTarget"

export class MainTarget extends BaseTarget {
  constructor() {
    super()
  }

  configureRules(configurator: WebpackConfigurator): void {
    super.configureRules(configurator)

    configurator.rules.push({
      test: /\.(png|jpg|gif)$/,
      use: [
        {
          loader: "url-loader",
          // to avoid any issues related to asar, embed any image up to 10MB as data url
          options: configureFileLoader("imgs", 10 * 1024 * 1024),
        }
      ]
    })
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    await BaseTarget.prototype.configurePlugins.call(this, configurator)

    if (configurator.isProduction) {
      configurator.plugins.push(new DefinePlugin({
        __static: `process.resourcesPath + "/${configurator.staticSourceDirectory}"`
      }))

      // do not add for main dev (to avoid adding to hot update chunks), our main-hmr install it
      configurator.plugins.push(new BannerPlugin({
        banner: 'require("source-map-support/source-map-support.js").install();',
        test: /\.js$/,
        raw: true,
        entryOnly: true,
      }))
      return
    }

    configurator.entryFiles.push(path.join(__dirname, "../electron-main-hmr/main-hmr"))
    const devIndexFile = await getFirstExistingFile(["index.dev.ts", "index.dev.js"], path.join(configurator.projectDir, "src/main"))
    if (devIndexFile != null) {
      configurator.entryFiles.push(devIndexFile)
    }
  }
}

import * as path from "path"
import { BannerPlugin } from "webpack"
import { getFirstExistingFile } from "../util"
import { WebpackConfigurator } from "../webpackConfigurator"
import { BaseTarget } from "./BaseTarget"

export class MainTarget extends BaseTarget {
  constructor() {
    super()
  }

  async configurePlugins(configurator: WebpackConfigurator): Promise<void> {
    await BaseTarget.prototype.configurePlugins.call(this, configurator)

    if (configurator.isProduction) {
      // do not add for main dev (to avoid adding to hot update chunks), our main-hmr install it
      configurator.plugins.push(new BannerPlugin({
        banner: 'require("source-map-support/source-map-support.js").install();',
        test: /\.js$/,
        raw: true,
        entryOnly: true,
      }))
      return
    }

    configurator.entryFiles.push(path.join(__dirname, "../../electron-main-hmr/main-hmr"))
    const devIndexFile = await getFirstExistingFile(["index.dev.ts", "index.dev.js"], path.join(configurator.projectDir, "src/main"))
    if (devIndexFile != null) {
      configurator.entryFiles.push(devIndexFile)
    }
  }
}
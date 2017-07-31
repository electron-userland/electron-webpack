import * as path from "path"
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
      return
    }

    configurator.entryFiles.push(path.join(__dirname, "../../electron-main-hmr/main-hmr"))
    const devIndexFiles = await getFirstExistingFile(["index.dev.ts", "index.dev.js"], path.join(configurator.projectDir, "src/main"))
    if (devIndexFiles.length !== 0) {
      configurator.entryFiles.push(devIndexFiles[0])
    }
  }
}
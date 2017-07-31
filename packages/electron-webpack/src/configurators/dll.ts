import { readdir, readJson } from "fs-extra-p"
import * as path from "path"
import { DllPlugin, DllReferencePlugin } from "webpack"
import { statOrNull } from "../util"
import { WebpackConfigurator } from "../webpackConfigurator"

export async function configureDll(configurator: WebpackConfigurator): Promise<string | null> {
  let dllManifest: string | null = null
  const projectDir = configurator.projectDir

  if (configurator.type === "renderer-dll") {
    const dll = configurator.electronWebpackConfig.renderer!!.dll
    if (dll == null) {
      throw new Error(`renderer-dll requires DLL configuration`)
    }

    configurator.config.entry = Array.isArray(dll) ? {vendor: dll} : dll

    dllManifest = path.join(configurator.commonDistDirectory, configurator.type, "manifest.json")
    configurator.plugins.push(new DllPlugin({
      name: "[name]",
      path: dllManifest,
      context: projectDir
    }))

    const output = configurator.config.output!
    // leave as default "var"
    delete output.libraryTarget
    output.library = "[name]"
  }
  else if (configurator.type === "renderer") {
    const dllDir = path.join(configurator.commonDistDirectory, "renderer-dll")
    const dirStat = await statOrNull(dllDir)
    if (dirStat == null || !dirStat.isDirectory()) {
      configurator.debug("No DLL directory")
      return null
    }

    configurator.debug(`DLL directory: ${dllDir}`)
    configurator.plugins.push(new DllReferencePlugin({
      context: projectDir,
      manifest: await readJson(path.join(dllDir, "manifest.json")),
    }))

    await addDllAssets(dllDir, configurator)
  }

  return dllManifest
}

async function addDllAssets(dllDir: string, configurator: WebpackConfigurator) {
  const assets = (await readdir(dllDir)).filter(it => it.endsWith(".js") || it.endsWith(".css"))
  const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin")
  configurator.plugins.push(new AddAssetHtmlPlugin(assets.map(asset => {
    const meta: Asset = {
      filepath: path.join(dllDir, asset),
      includeSourcemap: false,
    }
    if (asset.endsWith(".css")) {
      meta.typeOfAsset = "css"
    }

    return meta
  })))
}

interface Asset {
  filepath: string
  includeSourcemap: boolean
  typeOfAsset?: "js" | "css"
}
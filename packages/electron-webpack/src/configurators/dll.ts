import { readdir, readJson } from "fs-extra-p"
import * as path from "path"
import { DllPlugin, DllReferencePlugin } from "webpack"
import { WebpackConfigurator } from "../main"
import { orNullIfFileNotExist, statOrNull } from "../util"

export async function configureDll(configurator: WebpackConfigurator): Promise<string | null> {
  let dllManifest: string | null = null
  const projectDir = configurator.projectDir

  if (configurator.type === "renderer-dll") {
    const dll = configurator.electronWebpackConfiguration.renderer!!.dll
    if (dll == null) {
      throw new Error(`renderer-dll requires DLL configuration`)
    }

    configurator.config.entry = Array.isArray(dll) ? {vendor: dll} : dll

    dllManifest = path.join(configurator.commonDistDirectory, configurator.type, "manifest.json")
    configurator.plugins.push(new DllPlugin({
      name: "[name]",
      path: dllManifest,
      context: projectDir,
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
  }

  return dllManifest
}

export async function getDllAssets(dllDir: string, configurator: WebpackConfigurator) {
  if (configurator.electronWebpackConfiguration.renderer!!.dll == null) {
    return []
  }

  const files = await orNullIfFileNotExist(readdir(dllDir))
  return files == null ? [] : files.filter(it => it.endsWith(".js") || it.endsWith(".css")).sort()
}
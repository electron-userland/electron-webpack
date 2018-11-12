import { readJson } from "fs-extra-p"
import { Lazy } from "lazy-val"
import * as path from "path"
import { orNullIfFileNotExist } from "./util"
import { getConfig } from "read-config-file"

export { ElectronWebpackConfiguration } from "./core"

export async function getPackageMetadata(projectDir?: string | null) {
  return await orNullIfFileNotExist(readJson(path.join(projectDir || process.cwd(), "package.json")))
}

export async function getElectronWebpackConfig(projectDir?: string | null) {
  const packageMetadata = await getPackageMetadata(projectDir)
  return ((await getConfig({
    packageKey: "electronWebpack",
    configFilename: "electron-webpack",
    projectDir: projectDir || process.cwd(),
    packageMetadata: new Lazy(() => Promise.resolve(packageMetadata))
  })) || {} as any).result || {}
}

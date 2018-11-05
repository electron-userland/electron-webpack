import { readJson } from "fs-extra-p"
import { Lazy } from "lazy-val"
import * as path from "path"
import "source-map-support/register"
import { orNullIfFileNotExist } from "./util"
import { getConfig } from "read-config-file"

export { ElectronWebpackConfiguration } from "./core"

export async function getPackageMetadata() {
  const projectDir = process.cwd()
  return await orNullIfFileNotExist(readJson(path.join(projectDir, "package.json")))
}

export async function getElectronWebpackConfig() {
  const projectDir = process.cwd()
  const packageMetadata = await getPackageMetadata()
  const electronWebpackConfig = ((await getConfig({
    packageKey: "electronWebpack",
    configFilename: "electron-webpack",
    projectDir,
    packageMetadata: new Lazy(() => Promise.resolve(packageMetadata))
  })) || {} as any).result || {}
  return electronWebpackConfig
}

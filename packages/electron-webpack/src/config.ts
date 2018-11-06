import { readJson } from "fs-extra-p"
import { Lazy } from "lazy-val"
import * as path from "path"
import { getConfig } from "read-config-file"
import { ElectronWebpackConfiguration } from "./core"
import { orNullIfFileNotExist } from "./util"

export function getPackageMetadata(projectDir: string) {
  return new Lazy(() => orNullIfFileNotExist(readJson(path.join(projectDir, "package.json"))))
}

export interface ConfigurationRequest {
  projectDir: string
  packageMetadata: Lazy<{ [key: string]: any } | null> | null
}

export async function getElectronWebpackConfiguration(context: ConfigurationRequest): Promise<ElectronWebpackConfiguration> {
  const result = await getConfig({
    packageKey: "electronWebpack",
    configFilename: "electron-webpack",
    projectDir: context.projectDir,
    packageMetadata: context.packageMetadata
  })
  const configuration: ElectronWebpackConfiguration = result == null || result.result == null ? {} : result.result
  if (configuration.commonDistDirectory == null) {
    configuration.commonDistDirectory = "dist"
  }
  if (configuration.commonSourceDirectory == null) {
    configuration.commonSourceDirectory = "src/common"
  }
  return configuration
}

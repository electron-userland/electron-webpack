export interface PackageMetadata {
  dependencies: { [key: string]: any }
  devDependencies: { [key: string]: any }

  electronWebpack?: ElectronWebpackConfig
}

export interface ElectronWebpackConfig {
  whiteListedModules?: Array<string>
  electronVersion?: string

  renderer?: PartConfig
}

export type ConfigurationType = "main" | "renderer" | "renderer-dll" | "test"

export interface PartConfig {
  dll?: Array<string> | { [key: string]: any } | null
}

export interface ConfigEnv {
  production?: boolean | "true" | "false"
  autoClean?: boolean

  noMinimize?: boolean

  forkTsCheckerLogger?: any
}

export interface PackageMetadata {
  name?: string

  dependencies: { [key: string]: any }
  devDependencies: { [key: string]: any }

  electronWebpack?: ElectronWebpackConfig
}

export interface ElectronWebpackConfig {
  whiteListedModules?: Array<string>
  externals?: Array<string>
  electronVersion?: string

  renderer?: PartConfig
}

export type ConfigurationType = "main" | "renderer" | "renderer-dll" | "test"

export interface PartConfig {
  dll?: Array<string> | { [key: string]: any } | null
}

export interface ConfigEnv {
  projectDir?: string | null

  production?: boolean | "true" | "false"
  autoClean?: boolean

  noMinimize?: boolean

  forkTsCheckerLogger?: any
}

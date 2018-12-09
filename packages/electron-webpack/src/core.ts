export interface PackageMetadata {
  name?: string

  dependencies: { [key: string]: any }
  devDependencies: { [key: string]: any }

  electronWebpack?: ElectronWebpackConfiguration | null
}

export interface ElectronWebpackConfiguration {
  whiteListedModules?: Array<string>
  externals?: Array<string>
  electronVersion?: string

  renderer?: ElectronWebpackConfigurationRenderer | null
  main?: ElectronWebpackConfigurationMain | null

  staticSourceDirectory?: string | null
  commonSourceDirectory?: string | null
  commonDistDirectory?: string | null

  title?: string | boolean | null

  projectDir?: string | null
}

export type ConfigurationType = "main" | "renderer" | "renderer-dll" | "test"

export interface PartConfiguration {
  sourceDirectory?: string | null
}

export interface ElectronWebpackConfigurationRenderer extends PartConfiguration {
  dll?: Array<string> | { [key: string]: any } | null
  webpackConfig?: string | null
  webpackDllConfig?: string | null
}

export interface ElectronWebpackConfigurationMain extends PartConfiguration {
  /**
   * The extra [entry points](https://webpack.js.org/concepts/entry-points/).
   */
  extraEntries?: Array<string> | { [key: string]: string | Array<string> } | string
  webpackConfig?: string | null
}

export interface ConfigurationEnv {
  production?: boolean
  autoClean?: boolean

  minify?: boolean

  forkTsCheckerLogger?: any

  configuration?: ElectronWebpackConfiguration
}

import { WebpackConfigurator } from "../main"

export function configureEslint(configurator: WebpackConfigurator) {
  const hasPreset = configurator.hasDevDependency("electron-webpack-eslint")
  if (!(hasPreset || (configurator.hasDevDependency("eslint") && configurator.hasDevDependency("eslint-loader")))) {
    return
  }

  const options: { [name: string]: any } = {
    cwd: configurator.projectDir
  }
  if (hasPreset || configurator.hasDevDependency("eslint-friendly-formatter")) {
    options.formatter = require("eslint-friendly-formatter")
  }

  configurator.rules.push({
    test: /\.(jsx?|tsx?|vue)$/,
    enforce: "pre",
    exclude: /node_modules/,
    loader: "eslint-loader",
    options
  })
}
import { gte } from "semver"
import { WebpackConfigurator } from "../main"

export function createBabelLoader(configurator: WebpackConfigurator) {
  // better to use require instead of just preset name to avoid babel resolving (in our test we set custom resolver - and only in case of explicit required it works)
  const presets = [
    [
      require("babel-preset-env"), {
      modules: false,
      targets: computeBabelEnvTarget(configurator.isRenderer, configurator.electronVersion),
    }],
  ]
  const plugins = [
    require("babel-plugin-syntax-dynamic-import"),
  ]

  addBabelItem(presets, configurator.getMatchingDevDependencies({includes: ["babel-preset-"], excludes: ["babel-preset-env"]}))
  addBabelItem(plugins, configurator.getMatchingDevDependencies({includes: ["babel-plugin-"], excludes: ["babel-plugin-syntax-dynamic-import"]}))

  return {
    loader: "babel-loader",
    options: {
      presets,
      plugins
    }
  }
}

function addBabelItem(to: Array<any>, names: Array<string>) {
  for (const name of names) {
    const module = require(name)
    to.push([module.default || module])
  }
}

function computeBabelEnvTarget(isRenderer: boolean, electronVersion: string) {
  if (isRenderer) {
    return {
      electron: electronVersion
    }
  }

  // https://github.com/electron/electron/blob/1-6-x/.node-version
  let nodeVersion = "7.4.0"
  if (gte(electronVersion, "1.7.3")) {
    // https://github.com/electron/electron/blob/master/.node-version
    nodeVersion = "7.9.0"
  }

  return {
    node: nodeVersion
  }
}
import { gte } from "semver"
import { WebpackConfigurator } from "../main"

export function createBabelLoader(configurator: WebpackConfigurator) {
  // better to use require instead of just preset name to avoid babel resolving (in our test we set custom resolver - and only in case of explicit required it works)
  const presets = [
    [
      require("@babel/preset-env").default, {
      modules: false,
      targets: computeBabelEnvTarget(configurator.isRenderer, configurator.electronVersion),
    }],
  ]
  const plugins = [
    require("babel-plugin-syntax-dynamic-import"),
  ]

  if (configurator.type !== "main" && configurator.hasDependency("element-ui")) {
    plugins.push([require("babel-plugin-component"), {
      libraryName: "element-ui",
      styleLibraryName: "theme-chalk"
    }])
  }

  addBabelItem(presets, configurator.getMatchingDevDependencies({includes: ["babel-preset-"], excludes: ["babel-preset-env", "@babel/preset-env"]}))
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

  let nodeVersion = "7.4.0"
  if (gte(electronVersion, "2.0.0-beta.4")) {
    nodeVersion = "8.9.3"
  }
  else if (gte(electronVersion, "1.8.2")) {
    nodeVersion = "8.2.1"
  }
  else if (gte(electronVersion, "1.7.3")) {
    nodeVersion = "7.9.0"
  }

  return {
    node: nodeVersion
  }
}
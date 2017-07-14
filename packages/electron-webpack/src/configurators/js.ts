import { gte } from "semver"

export function computeBabelEnvTarget(isRenderer: boolean, electronVersion: string) {
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

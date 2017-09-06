import * as path from "path"
import { WebpackConfigurator } from "../../main"

export function configureReact(configurator: WebpackConfigurator) {
  if (!configurator.hasDependency("react")) {
    return
  }

  configurator.extensions.push(".jsx")

  if (!configurator.isProduction && configurator.type === "main") {
    configurator.entryFiles.push(path.join(__dirname, "react-main-dev-entry.js"))
  }
}

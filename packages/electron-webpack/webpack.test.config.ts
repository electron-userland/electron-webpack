import * as path from "path"
import { WebpackConfigurator } from "./src/webpackConfigurator"

export default (env: any) => new WebpackConfigurator("test", env).configure({
  testComponents: path.join(process.cwd(), "src/renderer/components/testComponents.ts")
})
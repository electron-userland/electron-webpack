import * as path from "path"
import { configure } from "./util/webpackConfigurator"

const entry = {
  prerequisites: path.join(process.cwd(), "src/renderer/components/testComponents.ts")
}

export default (env: any) => configure("test", env, entry)
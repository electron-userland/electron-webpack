import * as path from "path"
import { createConfigurator } from "./src/webpackConfigurator"

export default async (env: any) => (await createConfigurator("test", env)).configure({
  testComponents: path.join(process.cwd(), "src/renderer/components/testComponents.ts")
})
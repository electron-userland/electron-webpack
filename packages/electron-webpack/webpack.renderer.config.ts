import { configure } from "./src/webpackConfigurator"

export default (env: any) => configure("renderer", env)

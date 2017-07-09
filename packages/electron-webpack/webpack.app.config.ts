import BluebirdPromise from "bluebird-lst"
import { configure } from "./util/webpackConfigurator"

export default (env: any) => BluebirdPromise.all([configure("main", env), configure("renderer", env)])

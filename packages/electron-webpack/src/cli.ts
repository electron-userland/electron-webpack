#!/usr/bin/env node

import * as path from "path"
import yargs from "yargs"

// not strict because we allow to pass any webpack args
// tslint:disable-next-line:no-unused-expression
yargs
  .command(["app", "compile", "*"], "Compile application", yargs => yargs, argv => build("app"))
  .command(["main"], "Compile main process", yargs => yargs, argv => build("main"))
  .command(["renderer"], "Compile renderer process", yargs => yargs, argv => build("renderer"))
  .command(["dll"], "Compile DLL bundles", yargs => yargs, argv => build("renderer.dll"))
  .command(["dev"], "Run a development mode", yargs => yargs, argv => runInDevMode())
  .argv

function build(configFile: string) {
  const args = process.argv
  // if command `electron-webpack` - remove first 2 args, if `electron-webpack compile` (or any other subcommand name) - 3
  const sliceIndex = args.length > 2 && !args[2].startsWith("-") ? 3 : 2
  const extraWebpackArgs = sliceIndex < args.length ? args.slice(sliceIndex) : []
  // remove extra args
  args.length = 2
  if (!extraWebpackArgs.some(it => it.includes("--env.production"))) {
    args.push("--env.production")
  }
  args.push("--progress")
  args.push(...extraWebpackArgs)
  args.push("--config", path.join(__dirname, "..", `webpack.${configFile}.config.js`))

  require("yargs")(args.slice(2))
  require(path.join(process.cwd(), "node_modules", "webpack-cli", "bin", "webpack.js"))
}

function runInDevMode() {
  require("./dev/dev-runner")
}
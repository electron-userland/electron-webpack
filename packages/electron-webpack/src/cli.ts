#!/usr/bin/env node

import * as path from "path"
import yargs from "yargs"

// tslint:disable:no-unused-expression
yargs
  .command(["app", "*"], "Compile application", yargs => yargs, argv => build("app"))
  .command(["main"], "Compile main process", yargs => yargs, argv => build("main"))
  .command(["renderer"], "Compile renderer process", yargs => yargs, argv => build("renderer"))
  .command(["dll"], "Compile DLL bundles", yargs => yargs, argv => build("renderer.dll"))
  .command(["dev"], "Run a development mode", yargs => yargs, argv => runInDevMode())
  .help()
  .strict()
  .argv

function build(configFile: string) {
  const args = process.argv
  const extraWebpackArgs = args.length > 3 ? args.slice(3) : []
  // remove extra args
  args.length = 2
  args.push("--env.production")
  args.push("--progress")
  args.push(...extraWebpackArgs)
  args.push("--config", path.join(__dirname, "..", `webpack.${configFile}.config.js`))

  require("yargs")(args.slice(2))
  require(path.join(process.cwd(), "node_modules", "webpack", "bin", "webpack.js"))
}

function runInDevMode() {
  require("./dev-runner")
}
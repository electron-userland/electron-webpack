import BluebirdPromise from "bluebird-lst"
import { blue, ChalkChain, red, white, yellow } from "chalk"
import { ChildProcess, spawn } from "child_process"
import * as path from "path"

import "source-map-support/register"
import { Compiler, Configuration } from "webpack"
import WebpackDevServer from "webpack-dev-server"
import { configure } from "./util/webpackConfigurator"

const webpack = require("webpack")

const projectDir = process.cwd()

let electronProcess: ChildProcess | null = null
let manualRestart = false

class DevRunner {
  async start() {
    const configs = await BluebirdPromise.map(["main", "renderer"], it => configure(it as any, {production: false, autoClean: false}))
    const mainConfig: Configuration = configs[0]
    const rendererConfig: Configuration = configs[1]

    const mainEntry = mainConfig.entry as any
    mainEntry.main = [path.join(projectDir, "src/main/index.dev.ts")].concat(mainEntry.main)

    const rendererCompiler: Compiler = webpack(rendererConfig)

    await BluebirdPromise.all([this.startMain(mainConfig), this.startRenderer(rendererCompiler)])
      .then(() => startElectron())
  }

  startRenderer(rendererCompiler: Compiler) {
    // noinspection JSUnusedLocalSymbols
    return new BluebirdPromise((resolve, reject) => {
      rendererCompiler.plugin("done", stats => {
        logStats("Renderer", stats)
      })

      const server = new WebpackDevServer(rendererCompiler, {
        contentBase: projectDir,
        hot: true,
        stats: "errors-only",
      })
      server.listen(9080, "127.0.0.1", resolve)
    })
  }

  startMain(mainConfig: Configuration) {
    return new BluebirdPromise((resolve, reject) => {
      const compiler: Compiler = webpack(mainConfig)
      compiler.plugin("watch-run", (compilation, done) => {
        logStats("Main", white.bold("compiling..."))
        done()
      })

      compiler.watch({}, (err, stats) => {
        if (err) {
          reject(err)
          return
        }

        logStats("Main", stats)

        if (electronProcess != null && electronProcess.kill) {
          manualRestart = true
          process.kill(electronProcess.pid)
          electronProcess = null
          startElectron()

          setTimeout(() => {
            manualRestart = false
          }, 5000)
        }

        resolve()
      })
    })
  }
}

async function main() {
  const devRunner = new DevRunner()
  await devRunner.start()
}

main()
  .catch(error => {
    console.error(error)
  })

function logStats(proc: any, data: any) {
  let log = ""

  log += yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join("-")}`)
  log += "\n\n"

  if (typeof data === "object") {
    data
      .toString({
        colors: true,
        chunks: false
      })
      .split(/\r?\n/)
      .forEach((line: string) => {
        log += "  " + line + "\n"
      })
  }
  else {
    log += `  ${data}\n`
  }

  log += "\n" + yellow.bold(`┗ ${new Array(28 + 1).join("-")}`) + "\n"

  console.log(log)
}

function startElectron() {
  const args = ["--inspect=5858", path.join(projectDir, "dist/main/main.js")]
  if (process.env.IJ) {
    args.push("--debug-brk")
  }
  electronProcess = spawn(require("electron").toString(), args)

  electronProcess.stdout.on("data", data => {
    electronLog(data, blue)
  })
  electronProcess.stderr.on("data", data => {
    electronLog(data, red)
  })

  electronProcess.on("close", () => {
    if (!manualRestart) {
      process.exit()
    }
  })
}

function electronLog(data: any, color: ChalkChain) {
  let log = ""
  data
    .toString()
    .split(/\r?\n/)
    .forEach((line: string) => {
      log += `  ${line}\n`
    })
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      color.bold("┏ Electron -------------------") +
      "\n\n" +
      log +
      color.bold("┗ ----------------------------") +
      "\n"
    )
  }
}

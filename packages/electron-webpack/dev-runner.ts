import BluebirdPromise from "bluebird-lst"
import { blue, ChalkChain, red, white, yellow } from "chalk"
import { ChildProcess, spawn } from "child_process"
import * as path from "path"

import "source-map-support/register"
import { Compiler } from "webpack"
import { configure } from "./util/webpackConfigurator"

const webpack = require("webpack")

const projectDir = process.cwd()

let electronProcess: ChildProcess | null = null
let manualRestart = false

const debug = require("debug")("electron-webpack:dev-runner")

class DevRunner {
  async start() {
    await BluebirdPromise.all([this.startRenderer(), this.startMain()])
    startElectron()
  }

  startRenderer() {
    const webpackDevServerPath = path.join(projectDir, "node_modules", ".bin", "webpack-dev-server" + (process.platform === "win32" ? ".cmd" : ""))
    debug(`Start webpack-dev-server ${webpackDevServerPath}`)

    // 1. in another process to speedup compilation
    // 2. some loaders detect webpack-dev-server hot mode only if run as CLI
    return new BluebirdPromise((resolve, reject) => {
      let _resolve: (() => void) | null = resolve
      let _reject: ((error: Error) => void) | null = reject
      let webpackDevServer: ChildProcess | null = spawn(webpackDevServerPath, ["--color", "--config", path.join(__dirname, "webpack.renderer.config.js")], {
        // to force debug colors in the child process
        env: {...process.env, DEBUG_COLORS: true}
      })
      webpackDevServer.stdout.on("data", (data: string) => {
        logProcess("Renderer", data, blue)

        const r = _resolve
        // we must resolve only after compilation, otherwise devtools disconnected
        if (r != null && data.includes("webpack: Compiled successfully.")) {
          _resolve = null
          r()
        }
      })
      webpackDevServer.stderr.on("data", (data: string) => {
        logProcess("Renderer", data, red)
      })

      const killProcess = () => {
        if (webpackDevServer != null) {
          debug("Kill webpackDevServer\n")
          webpackDevServer.kill()
          webpackDevServer = null
        }
      }
      process.once("beforeExit", killProcess)
      process.on("SIGINT", killProcess)

      webpackDevServer.on("close", code => {
        if (_resolve != null) {
          _resolve = null
        }
        if (_reject != null) {
          _reject(new Error())
          _reject = null
        }

        const message = `webpackDevServer process exited with code ${code}\n`
        if (code === 0) {
          debug(message)
        }
        else {
          logProcess("Renderer", message, red)
        }
      })
    })
  }

  async startMain() {
    const mainConfig = await configure("main", {production: false, autoClean: false})

    const mainEntry = mainConfig.entry as any
    mainEntry.main = [path.join(projectDir, "src/main/index.dev.ts")].concat(mainEntry.main)

    await new BluebirdPromise((resolve, reject) => {
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

  electronProcess.stdout.on("data", (data: string) => {
    logProcess("Electron", data, blue)
  })
  electronProcess.stderr.on("data", (data: string) => {
    logProcess("Electron", data, red)
  })

  electronProcess.on("close", () => {
    if (!manualRestart) {
      process.exit()
    }
  })
}

function logProcess(label: "Electron" | "Renderer", data: string | Buffer, color: ChalkChain) {
  const log = "  " + data.toString().trim().split(/\r?\n/).join(`\n  `)
  if (/[0-9A-z]+/.test(log)) {
    process.stdout.write(
      color.bold(`┏ ${label} -------------------`) +
      "\n\n" + log + "\n\n" +
      color.bold("┗ ----------------------------") +
      "\n\n"
    )
  }
}

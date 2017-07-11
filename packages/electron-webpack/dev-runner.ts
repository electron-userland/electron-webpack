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
      let webpackDevServer: ChildProcess | null
      try {
        webpackDevServer = spawn(webpackDevServerPath, ["--color", "--config", path.join(__dirname, "webpack.renderer.config.js")], {
          // to force debug colors in the child process
          env: {...process.env, DEBUG_COLORS: true, NODE_ENV: "development"}
        })
      }
      catch (e) {
        reject(e)
        return
      }

      const killProcess = () => {
        if (webpackDevServer != null) {
          if (debug.enabled) {
            debug("Kill webpackDevServer")
          }
          webpackDevServer.kill("SIGINT")
          webpackDevServer = null
        }
      }
      process.on("beforeExit", killProcess)
      process.on("uncaughtException", killProcess)
      process.on("exit", killProcess)
      process.on("SIGINT", killProcess)
      process.on("SIGQUIT", killProcess)

      webpackDevServer.on("error", error => {
        if (_reject == null) {
          logProcess("Renderer", error.stack || error.toString(), red)
        }
        else {
          _reject(error)
          _reject = null
        }
      })

      webpackDevServer.stdout.on("data", data => {
        logProcess("Renderer", data, blue)

        const r = _resolve
        // we must resolve only after compilation, otherwise devtools disconnected
        if (r != null && data.toString().includes("webpack: Compiled successfully.")) {
          _resolve = null
          r()
        }
      })

      webpackDevServer.stderr.on("data", data => {
        logProcess("Renderer", data, red)
      })

      webpackDevServer.on("close", code => {
        webpackDevServer = null

        process.removeListener("beforeExit", killProcess)
        process.removeListener("uncaughtException", killProcess)
        process.removeListener("exit", killProcess)
        process.removeListener("SIGINT", killProcess)
        process.removeListener("SIGQUIT", killProcess)

        const message = `webpackDevServer process exited with code ${code}`

        if (_resolve != null) {
          _resolve = null
        }
        if (_reject != null) {
          _reject(new Error(message))
          _reject = null
        }

        if (code === 0) {
          if (debug.enabled) {
            debug(message)
            // otherwise no newline in the terminal
            process.stderr.write("\n")
          }
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

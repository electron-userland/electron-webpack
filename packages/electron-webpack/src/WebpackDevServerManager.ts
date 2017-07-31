import BluebirdPromise from "bluebird-lst"
import { blue, red } from "chalk"
import { ChildProcess, spawn } from "child_process"
import * as path from "path"
import { getCommonEnv, logError, logProcess, logProcessErrorOutput } from "./DevRunnerUtil"

const debug = require("debug")("electron-webpack:dev-runner")

function spawnWds(projectDir: string) {
  const webpackDevServerPath = path.join(projectDir, "node_modules", ".bin", "webpack-dev-server" + (process.platform === "win32" ? ".cmd" : ""))
  debug(`Start webpack-dev-server ${webpackDevServerPath}`)
  return spawn(webpackDevServerPath, ["--color", "--config", path.join(__dirname, "../webpack.renderer.config.js")], {
    env: getCommonEnv(),
  })
}

// 1. in another process to speedup compilation
// 2. some loaders detect webpack-dev-server hot mode only if run as CLI
export function startRenderer(projectDir: string) {
  return new BluebirdPromise((resolve: (() => void) | null, reject: ((error: Error) => void) | null) => {
    let webpackDevServer: ChildProcess | null
    try {
      webpackDevServer = spawnWds(projectDir)
    }
    catch (e) {
      reject!(e)
      return
    }

    onDeath(eventName => {
      if (webpackDevServer == null) {
        return
      }

      if (debug.enabled) {
        debug(`Kill webpackDevServer on ${eventName}`)
      }
      webpackDevServer.kill("SIGINT")
      webpackDevServer = null
    })

    webpackDevServer.on("error", error => {
      if (reject == null) {
        logError("Renderer", error)
      }
      else {
        reject(error)
        reject = null
      }
    })

    webpackDevServer.stdout.on("data", (data: string) => {
      logProcess("Renderer", data, blue)

      const r = resolve
      // we must resolve only after compilation, otherwise devtools disconnected
      if (r != null && data.includes("webpack: Compiled successfully.")) {
        resolve = null
        r()
      }
    })

    logProcessErrorOutput("Renderer", webpackDevServer)

    webpackDevServer.on("close", code => {
      webpackDevServer = null

      const message = `webpackDevServer process exited with code ${code}`

      if (resolve != null) {
        resolve = null
      }
      if (reject != null) {
        reject(new Error(message))
        reject = null
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

function onDeath(handler: (eventName: string) => void) {
  function registerListener(eventName: string) {
    process.on(eventName as any, () => handler(eventName))
  }

  registerListener("beforeExit")
  registerListener("exit")
  registerListener("SIGINT")
  registerListener("SIGQUIT")

  process.on("uncaughtException", error => {
    process.stderr.write(error.stack || error.toString())
    handler("uncaughtException")
  })
}
import BluebirdPromise from "bluebird-lst"
import chalk from "chalk"
import { spawn } from "child_process"
import { readdir, remove } from "fs-extra-p"
import * as path from "path"
import "source-map-support/register"
import webpack, { Compiler } from "webpack"
import { HmrServer } from "../electron-main-hmr/HmrServer"
import { configure } from "../main"
import { getFreePort, orNullIfFileNotExist } from "../util"
import { DelayedFunction, getCommonEnv, logError, logProcess, logProcessErrorOutput } from "./devUtil"
import { startRenderer } from "./WebpackDevServerManager"

const projectDir = process.cwd()

let socketPath: string | null = null

const debug = require("debug")("electron-webpack")

// do not remove main.js to allow IDE to keep breakpoints
async function emptyMainOutput() {
  const outDir = path.join(projectDir, "dist", "main")
  const files = await orNullIfFileNotExist(readdir(outDir))
  if (files == null) {
    return
  }

  await BluebirdPromise.map(files.filter(it => !it.startsWith(".") && it !== "main.js"), it => remove(outDir + path.sep + it))
}

class DevRunner {
  async start() {
    const wdsHost = "localhost"
    const wdsPort = await getFreePort(wdsHost, 9080)
    const env = {
      ...getCommonEnv(),
      ELECTRON_WEBPACK_WDS_HOST: wdsHost,
      ELECTRON_WEBPACK_WDS_PORT: wdsPort,
    }

    const hmrServer = new HmrServer()
    await BluebirdPromise.all([
      startRenderer(projectDir, env),
      hmrServer.listen()
        .then(it => {
          socketPath = it
        }),
      emptyMainOutput()
        .then(() => this.startMainCompilation(hmrServer)),
    ])

    hmrServer.ipc.on("error", (error: Error) => {
      logError("Main", error)
    })

    const electronArgs = process.env.ELECTRON_ARGS
    const args = electronArgs != null && electronArgs.length > 0 ? JSON.parse(electronArgs) : [`--inspect=${await getFreePort("127.0.0.1", 5858)}`]
    args.push(path.join(projectDir, "dist/main/main.js"))
    // Pass remaining arguments to the application. Remove 3 instead of 2, to remove the `dev` argument as well.
    args.push(...process.argv.slice(3))
    // we should start only when both start and main are started
    startElectron(args, env)
  }

  async startMainCompilation(hmrServer: HmrServer) {
    const mainConfig = await configure("main", {
      production: false,
      autoClean: false,
      forkTsCheckerLogger: {
        info: () => {
          // ignore
        },

        warn: (message: string) => {
          logProcess("Main", message, chalk.yellow)
        },

        error: (message: string) => {
          logProcess("Main", message, chalk.red)
        },
      },
    })

    await new BluebirdPromise((resolve: (() => void) | null, reject: ((error: Error) => void) | null) => {
      const compiler: Compiler = webpack(mainConfig!!)

      const printCompilingMessage = new DelayedFunction(() => {
        logProcess("Main", "Compiling...", chalk.yellow)
      })
      compiler.plugin("compile", () => {
        hmrServer.beforeCompile()
        printCompilingMessage.schedule()
      })

      let watcher: Compiler.Watching | null = compiler.watch({}, (error, stats) => {
        printCompilingMessage.cancel()

        if (watcher == null) {
          return
        }

        if (error != null) {
          if (reject == null) {
            logError("Main", error)
          }
          else {
            reject(error)
            reject = null
          }
          return
        }

        logProcess("Main", stats.toString({
          colors: true,
        }), chalk.yellow)

        if (resolve != null) {
          resolve()
          resolve = null
          return
        }

        hmrServer.built(stats)
      })

      require("async-exit-hook")((callback: () => void) => {
        debug(`async-exit-hook: ${callback == null}`)
        const w = watcher
        if (w == null) {
          return
        }

        watcher = null
        w.close(() => callback())
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

function startElectron(electronArgs: Array<string>, env: any) {
  const electronProcess = spawn(require("electron").toString(), electronArgs, {
    env: {
      ...env,
      ELECTRON_HMR_SOCKET_PATH: socketPath,
    }
  })

  // required on windows
  require("async-exit-hook")(() => {
    electronProcess.kill("SIGINT")
  })

  let queuedData: string | null = null
  electronProcess.stdout.on("data", data => {
    data = data.toString()
    // do not print the only line - doesn't make sense
    if (data.trim() === "[HMR] Updated modules:") {
      queuedData = data
      return
    }

    if (queuedData != null) {
      data = queuedData + data
      queuedData = null
    }

    logProcess("Electron", data, chalk.blue)
  })

  logProcessErrorOutput("Electron", electronProcess)

  electronProcess.on("close", exitCode => {
    debug(`Electron exited with exit code ${exitCode}`)
    if (exitCode === 100) {
      setImmediate(() => {
        startElectron(electronArgs, env)
      })
    }
    else {
      (process as any).emit("message", "shutdown")
    }
  })
}
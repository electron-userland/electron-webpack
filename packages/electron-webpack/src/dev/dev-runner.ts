import BluebirdPromise from "bluebird-lst"
import { blue, red, yellow } from "chalk"
import { spawn } from "child_process"
import { readdir, remove } from "fs-extra-p"
import * as path from "path"
import "source-map-support/register"
import { Compiler } from "webpack"
import { HmrServer } from "../electron-main-hmr/HmrServer"
import { configure } from "../main"
import { orNullIfFileNotExist } from "../util"
import { DelayedFunction, getCommonEnv, logError, logProcess, logProcessErrorOutput } from "./devUtil"
import { startRenderer } from "./WebpackDevServerManager"

const webpack = require("webpack")

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
    const hmrServer = new HmrServer()
    await BluebirdPromise.all([
      startRenderer(projectDir),
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

    // we should start only when both start and main are started
    startElectron()
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
          logProcess("Main", message, yellow)
        },

        error: (message: string) => {
          logProcess("Main", message, red)
        },
      },
    })

    await new BluebirdPromise((resolve: (() => void) | null, reject: ((error: Error) => void) | null) => {
      const compiler: Compiler = webpack(mainConfig)

      const printCompilingMessage = new DelayedFunction(() => {
        logProcess("Main", "Compiling...", yellow)
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
        }), yellow)

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

function startElectron() {
  const electronArgs = process.env.ELECTRON_ARGS
  const args = electronArgs != null && electronArgs.length > 0 ? JSON.parse(electronArgs) : ["--inspect=5858"]
  args.push(path.join(projectDir, "dist/main/main.js"))
  const electronProcess = spawn(require("electron").toString(), args, {
    env: {
      ...getCommonEnv(),
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

    logProcess("Electron", data, blue)
  })

  logProcessErrorOutput("Electron", electronProcess)

  electronProcess.on("close", exitCode => {
    debug(`Electron exited with exit code ${exitCode}`)
    if (exitCode === 100) {
      setImmediate(() => {
        startElectron()
      })
    }
    else {
      (process as any).emit("message", "shutdown")
    }
  })
}
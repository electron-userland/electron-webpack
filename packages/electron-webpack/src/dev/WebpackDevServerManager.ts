import BluebirdPromise from "bluebird-lst"
import { blue } from "chalk"
import { ChildProcess } from "child_process"
import * as path from "path"
import { statOrNull } from "../util"
import { createConfigurator } from "../webpackConfigurator"
import { ChildProcessManager, PromiseNotifier, run } from "./ChildProcessManager"
import { getCommonEnv, LineFilter, logError, logProcess, logProcessErrorOutput } from "./devUtil"

const debug = require("debug")("electron-webpack")

function runWds(projectDir: string) {
  const isWin = process.platform === "win32"
  const webpackDevServerPath = path.join(projectDir, "node_modules", ".bin", "webpack-dev-server" + (isWin ? ".cmd" : ""))
  debug(`Start renderer WDS ${webpackDevServerPath}`)
  return run(webpackDevServerPath, ["--color", "--env.autoClean=false", "--config", path.join(__dirname, "../../webpack.renderer.config.js")], {
    env: getCommonEnv(),
    cwd: projectDir,
  })
}

// 1. in another process to speedup compilation
// 2. some loaders detect webpack-dev-server hot mode only if run as CLI
export async function startRenderer(projectDir: string) {
  const webpackConfigurator = await createConfigurator("renderer", {production: false, configuration: {projectDir}})
  const sourceDir = webpackConfigurator.sourceDir
  // explicitly set to null - do not handle at all and do not show info message
  if (sourceDir === null) {
    return
  }

  const dirStat = await statOrNull(sourceDir)
  if (dirStat == null || !dirStat.isDirectory()) {
    logProcess("Renderer", `No renderer source directory (${path.relative(projectDir, sourceDir)})`, blue)
    return
  }

  const lineFilter = new CompoundRendererLineFilter([
    new OneTimeLineFilter("Project is running at "),
    new OneTimeLineFilter("webpack output is served from "),
  ])
  return await new BluebirdPromise((resolve: (() => void) | null, reject: ((error: Error) => void) | null) => {
    let devServerProcess: ChildProcess | null
    try {
      devServerProcess = runWds(projectDir)
    }
    catch (e) {
      reject!(e)
      return
    }

    //tslint:disable-next-line:no-unused-expression
    new ChildProcessManager(devServerProcess, "Renderer WDS", new PromiseNotifier(resolve, reject))
    devServerProcess.on("error", error => {
      if (reject == null) {
        logError("Renderer", error)
      }
      else {
        reject(error)
        reject = null
      }
    })

    devServerProcess.stdout.on("data", (data: string) => {
      logProcess("Renderer", data, blue, lineFilter)

      const r = resolve
      // we must resolve only after compilation, otherwise devtools disconnected
      if (r != null && data.includes("webpack: Compiled successfully.")) {
        resolve = null
        r()
      }
    })

    logProcessErrorOutput("Renderer", devServerProcess)
  })
}

class OneTimeLineFilter implements LineFilter {
  private filtered = false

  constructor(private readonly prefix: string) {
  }

  filter(line: string) {
    if (!this.filtered && line.startsWith(this.prefix)) {
      this.filtered = true
      return false

    }
    return true
  }
}

class CompoundRendererLineFilter implements LineFilter {
  constructor(private readonly filters: Array<LineFilter>) {
  }

  filter(line: string) {
    return !this.filters.some(it => !it.filter(line))
  }
}
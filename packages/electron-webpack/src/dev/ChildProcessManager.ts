import { ChildProcess, spawn, SpawnOptions } from "child_process"
import * as path from "path"

const debug = require("debug")("@paulwib/electron-webpack")

export function run(programm: string, args: Array<string>, options: SpawnOptions) {
  const isWin = process.platform === "win32"
  return spawn(isWin ? path.join(__dirname, "../../vendor/runnerw.exe") : programm, isWin ? [programm].concat(args) : args, options)
}

export class ChildProcessManager {
  private mainProcessExitCleanupCallback: (() => void) | null = null
  private child: ChildProcess | null

  constructor(child: ChildProcess, debugLabel: string, promiseNotifier: PromiseNotifier | null) {
    this.child = child

    require("async-exit-hook")((callback: () => void) => {
      this.mainProcessExitCleanupCallback = callback
      const child = this.child
      if (child == null) {
        return
      }

      this.child = null

      if (promiseNotifier != null) {
        promiseNotifier.resolve()
      }

      if (debug.enabled) {
        debug(`Send SIGINT to ${debugLabel}`)
      }

      if (process.platform === "win32") {
        child.stdin.end(Buffer.from([5, 5]))
      }
      else {
        child.kill("SIGINT")
      }
    })

    child.on("close", code => {
      const mainProcessExitCleanupCallback = this.mainProcessExitCleanupCallback
      if (mainProcessExitCleanupCallback != null) {
        this.mainProcessExitCleanupCallback = null
        mainProcessExitCleanupCallback()
      }

      const child = this.child
      if (child == null) {
        return
      }

      this.child = null

      const message = `${debugLabel} exited with code ${code}`

      if (promiseNotifier != null) {
        promiseNotifier.reject(new Error(message))
      }

      if (code === 0) {
        if (debug.enabled) {
          debug(message)
          // otherwise no newline in the terminal
          process.stderr.write("\n")
        }
      }
      else {
        process.stderr.write(`${message}\n`)
      }
    })
  }
}

export class PromiseNotifier {
  constructor(private _resolve: (() => void) | null, private _reject: ((error: Error) => void) | null) {
  }

  resolve() {
    const r = this._resolve
    if (r != null) {
      this._resolve = null
      r()
    }
  }

  reject(error: Error) {
    if (this._resolve != null) {
      this._resolve = null
    }

    const _reject = this._reject
    if (_reject != null) {
      this._reject = null
      _reject(error)
    }
  }
}
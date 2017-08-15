import BluebirdPromise from "bluebird-lst"
import { lstat, readdir, remove, Stats } from "fs-extra-p"
import * as path from "path"
import { Compiler } from "webpack"
import { orNullIfFileNotExist } from "../util"

export const MAX_FILE_REQUESTS = 8
export const CONCURRENCY = {concurrency: MAX_FILE_REQUESTS}

const debug = require("debug")("electron-webpack:clean")

export async function walk(initialDirPath: string, filter?: Filter | null): Promise<Array<string>> {
  const result: Array<string> = []
  const queue: Array<string> = [initialDirPath]
  let addDirToResult = false
  while (queue.length > 0) {
    const dirPath = queue.pop()!

    const childNames = await orNullIfFileNotExist(readdir(dirPath))
    if (childNames == null) {
      continue
    }

    if (addDirToResult) {
      result.push(dirPath)
    }
    else {
      addDirToResult = true
    }

    childNames.sort()

    const dirs: Array<string> = []
    // our handler is async, but we should add sorted files, so, we add file to result not in the mapper, but after map
    const sortedFilePaths = await BluebirdPromise.map(childNames, name => {
      const filePath = dirPath + path.sep + name
      return lstat(filePath)
        .then(stat => {
          if (filter != null && !filter(filePath, stat)) {
            return null
          }

          if (stat.isDirectory()) {
            dirs.push(name)
            return null
          }
          else {
            return filePath
          }
        })
    }, CONCURRENCY)

    for (const child of sortedFilePaths) {
      if (child != null) {
        result.push(child)
      }
    }

    dirs.sort()
    for (const child of dirs) {
      queue.push(dirPath + path.sep + child)
    }
  }

  return result
}

export type Filter = (file: string, stat: Stats) => boolean

export class WebpackRemoveOldAssetsPlugin {
  constructor(private readonly dllManifest: string | null) {
  }

  apply(compiler: Compiler) {
    compiler.plugin("after-emit", (compilation: any, callback: (error?: Error) => void) => {
      const newlyCreatedAssets = compilation.assets
      const outDir = compiler.options.output!.path!
      walk(outDir, (file, stat) => {
        // dll plugin
        if (file === this.dllManifest) {
          return false
        }

        const relativePath = file.substring(outDir.length + 1)
        if (stat.isFile()) {
          return newlyCreatedAssets[relativePath] == null
        }
        else if (stat.isDirectory()) {
          for (const p of Object.keys(newlyCreatedAssets)) {
            if (p.length > relativePath.length && (p[relativePath.length] === "/" || p[relativePath.length] === "\\") && p.startsWith(relativePath)) {
              return false
            }
          }
          return true
        }
        return false
      })
        .then((it): any => {
          if (it.length === 0) {
            return null
          }

          if (debug.enabled) {
            debug(`Remove outdated files:\n  ${it.join("\n  ")}`)
          }
          return BluebirdPromise.map(it, it => remove(it), CONCURRENCY)
        })
        .then(() => callback())
        .catch()
    })
  }
}

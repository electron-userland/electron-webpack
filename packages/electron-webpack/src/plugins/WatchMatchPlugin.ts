import { Compiler } from "webpack"

export class WatchFilterPlugin {
  constructor(private readonly filter: WatchFileSystemFilter, private readonly debug: any) {
  }

  apply(compiler: Compiler) {
    compiler.plugin("after-environment", () => {
      (compiler as any).watchFileSystem = new IgnoringWatchFileSystem((compiler as any).watchFileSystem, this.filter, this.debug)
    })
  }
}

interface WatchFileSystem {
  watch(files: Array<string>, dirs: Array<string>, missing: Array<string>, startTime: number, options: any, callback: WatchFileSystemCallback, callbackUndelayed: () => void): void
}

// include or not
export type WatchFileSystemFilter = (file: string) => boolean

export type WatchFileSystemCallback = (error: Error | null, filesModified?: Array<string>, dirsModified?: Array<string>, missingModified?: Array<string>, fileTimestamps?: { [key: string]: number }, dirTimestamps?: { [key: string]: number }) => void

class IgnoringWatchFileSystem {
  constructor(private readonly wfs: WatchFileSystem, private readonly filter: WatchFileSystemFilter, private readonly debug: any) {
  }

  watch(files: Array<string>, dirs: Array<string>, missing: Array<string>, startTime: number, options: any, callback: WatchFileSystemCallback, callbackUndelayed: () => void) {
    const includedFiles: Array<string> = []
    const includedDirs: Array<string> = []
    const excludedFiles: Array<string> = []
    const excludedDirs: Array<string> = []
    separate(this.filter, files, includedFiles, excludedFiles)
    separate(this.filter, dirs, includedDirs, excludedDirs)

    if (this.debug.enabled) {
      this.debug(`files:${stringifyList(files)}\ndirs:${stringifyList(dirs)}\nmissing:${stringifyList(missing)}`)
      this.debug(`includedFiles:${stringifyList(includedFiles)}\nincludedDirs:${stringifyList(includedDirs)}\nexcludedFiles:${stringifyList(excludedFiles)}\nexcludedDirs:${stringifyList(excludedDirs)}`)
    }

    return this.wfs.watch(includedFiles, includedDirs, missing, startTime, options, (error, filesModified, dirsModified, missingModified, fileTimestamps, dirTimestamps) => {
      if (error != null) {
        callback(error)
        return
      }

      for (const p of excludedFiles) {
        fileTimestamps![p] = 1
      }

      for (const p of excludedDirs) {
        dirTimestamps![p] = 1
      }

      callback(null, filesModified, dirsModified, missingModified, fileTimestamps, dirTimestamps)
    }, callbackUndelayed)
  }
}

function separate(filter: WatchFileSystemFilter, list: Array<string>, included: Array<string>, excluded: Array<string>) {
  for (const file of list) {
    (filter(file) ? included : excluded).push(file)
  }
}

function stringifyList(list: Array<string>) {
  return `\n  ${list.map(it => it.startsWith(process.cwd()) ? it.substring(process.cwd().length + 1) : it).join(",\n  ")}`
}
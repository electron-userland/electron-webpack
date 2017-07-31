import BluebirdPromise from "bluebird-lst"
import { stat, Stats } from "fs-extra-p"
import * as path from "path"

export async function statOrNull(file: string): Promise<Stats | null> {
  return orNullIfFileNotExist(stat(file))
}

export function orNullIfFileNotExist<T>(promise: Promise<T>): Promise<T | null> {
  return orIfFileNotExist(promise, null)
}

export function orIfFileNotExist<T>(promise: Promise<T>, fallbackValue: T): Promise<T> {
  return promise
    .catch(e => {
      if (e.code === "ENOENT" || e.code === "ENOTDIR") {
        return fallbackValue
      }
      throw e
    })
}

export class Lazy<T> {
  private _value: Promise<T>
  private creator: (() => Promise<T>) | null

  get value(): Promise<T> {
    if (this.creator == null) {
      return this._value
    }

    this.value = this.creator()
    return this._value
  }

  set value(value: Promise<T>) {
    this._value = value
    this.creator = null
  }

  constructor(creator: () => Promise<T>) {
    this.creator = creator
  }
}

export function getFirstExistingFile(names: Array<string>, rootDir: string | null): Promise<string | null> {
  return BluebirdPromise.filter(names.map(it => rootDir == null ? it : path.join(rootDir, it)), it => statOrNull(it).then(it => it != null))
    .then(it => it.length > 0 ? it[0] : null)
}
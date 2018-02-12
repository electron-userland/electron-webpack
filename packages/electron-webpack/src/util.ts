import BluebirdPromise from "bluebird-lst"
import { stat, Stats } from "fs-extra-p"
import { createServer } from "net"
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

export function getFirstExistingFile(names: Array<string>, rootDir: string | null): Promise<string | null> {
  return BluebirdPromise.filter(names.map(it => rootDir == null ? it : path.join(rootDir, it)), it => statOrNull(it).then(it => it != null))
    .then(it => it.length > 0 ? it[0] : null)
}

export function getFreePort(defaultHost: string, defaultPort: number) {
  return new BluebirdPromise((resolve, reject) => {
    const server = createServer({pauseOnConnect: true})
    server.addListener("listening", () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })

    function doListen(port: number) {
      server.listen({
        host: defaultHost,
        port,
        backlog: 1,
        exclusive: true
      })
    }

    server.on("error", e => {
      if ((e as any).code === "EADDRINUSE") {
        server.close(() => doListen(0))
      }
      else {
        reject(e)
      }
    })

    doListen(defaultPort)
  })
}
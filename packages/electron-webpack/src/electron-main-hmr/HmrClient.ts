import Crocket from "crocket"

const debug = require("debug")("@paulwib/electron-webpack:main-client-hmr")

interface BuiltMessage {
  hash: string
}

export class HmrClient {
  lastHash: string | null = null

  private readonly ipc = new Crocket()

  constructor(socketPath: string, private hot: __WebpackModuleApi.Hot, private readonly currentHashGetter: () => string) {
    if (hot == null) {
      throw new Error(`[HMR] Hot Module Replacement is disabled.`)
    }

    this.ipc.connect({path: socketPath}, error => {
      if (error != null) {
        console.error(error.stack || error.toString())
      }
      if (debug.enabled) {
        debug(`Connected to server (${socketPath})`)
      }
    })

    this.ipc.on<Error>("error", error => {
      console.error(error.stack || error.toString())
    })

    this.ipc.on<BuiltMessage>("/built", data => {
      this.lastHash = data.hash
      if (this.isUpToDate()) {
        if (debug.enabled) {
          debug(`Up to date, hash ${data.hash}`)
        }
        return
      }

      const status = hot.status()
      if (status === "idle") {
        this.check()
      }
      else if (status === "abort" || status === "fail") {
        console.warn(`[HMR] Cannot apply update as a previous update ${status}ed. Need to do a full reload!`)
      }
      else if (debug.enabled) {
        debug(`Cannot check changes, status ${status}`)
      }
    })
  }

  private isUpToDate() {
    return this.lastHash === this.currentHashGetter()
  }

  private check() {
    this.hot.check(true)
      .then(outdatedModules => {
        if (outdatedModules == null) {
          console.warn(`[HMR] Cannot find update. Need to do a full reload!`)
          console.warn(`[HMR] (Probably because of restarting the webpack-dev-server)`)
          return
        }

        require("webpack/hot/log-apply-result")(outdatedModules, outdatedModules)

        if (this.isUpToDate()) {
          console.log(`[HMR] App is up to date.`)
        }
      })
      .catch(error => {
        const status = this.hot.status()
        if (status === "abort" || status === "fail") {
          console.warn(`[HMR] ${error.stack || error.toString()}`)
          console.warn("[HMR] Cannot apply update. Need to do a full reload - application will be restarted")
          require("electron").app.exit(100)
        }
        else {
          console.warn(`[HMR] Update failed: ${error.stack || error.message}`)
        }
      })
  }
}
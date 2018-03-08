require("source-map-support/source-map-support.js").install()

const socketPath = process.env.ELECTRON_HMR_SOCKET_PATH!
if (socketPath == null) {
  throw new Error(`[HMR] Env ELECTRON_HMR_SOCKET_PATH is not set`)
}

// module, but not relative path must be used (because this file is used as entry)
const HmrClient = require("@paulwib/electron-webpack/out/electron-main-hmr/HmrClient").HmrClient
// tslint:disable:no-unused-expression
new HmrClient(socketPath, (module as any).hot, () => {
  return __webpack_hash__
})
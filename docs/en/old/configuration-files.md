You are not forced to use provided [electron-webpack CLI](./package-scripts.md).
Webpack [documentation](https://webpack.js.org/api/cli/) is fully applicable.

* `node_modules/electron-webpack/webpack.main.config.js` Compile main.
* `node_modules/electron-webpack/webpack.renderer.config.js` Compile renderer.
* `node_modules/electron-webpack/webpack.app.config.js` Compile both main and renderer.
* `node_modules/electron-webpack/webpack.renderer.dll.config.js` Compile DLL bundles for renderer.

For example, to build main process for production, `webpack --env.production --config node_modules/electron-webpack/webpack.main.config.js`.

Everyone loves freedom and electron-webpack doesn't attempt to replace [webpack CLI]((https://webpack.js.org/api/cli/)).
You can use electron-webpack just as a collection of configuration files, if you want.
Webpack [documentation](https://webpack.js.org/api/cli/) is fully applicable. For example, to build for production, specify `--env.production`.

* `node_modules/electron-webpack/webpack.main.config.js` Compile main.
* `node_modules/electron-webpack/webpack.renderer.config.js` Compile renderer.
* `node_modules/electron-webpack/webpack.app.config.js` Compile both main and renderer.
* `node_modules/electron-webpack/webpack.renderer.dll.config.js` Compile DLL bundles for renderer.
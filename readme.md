# electron-webpack [![npm version](https://img.shields.io/npm/v/electron-webpack.svg)](https://npmjs.org/package/electron-webpack)

Configurations and scripts to compile Electron applications.

## Install

1. `yarn add webpack electron-webpack --dev`
2. `yarn add source-map-support`
3. Install support for various [languages and frameworks](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks) —
[typescript](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#typescript),
[vue](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#vue) and
[less](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#less) if need.

[Yarn](http://yarnpkg.com/) is recommended instead of npm.

## Project Structure

```
├─ src
│  ├─ main # main process sources
│  │  └─ index.js
│  ├─ renderer # renderer process sources
│  │  └─ index.js
├─ static # static assets (optional directory)
```

Index file expected to be named as `index.js` or `main.js` (`.ts` if [typescript support](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#typescript) installed)

Real project example — [electrify](https://github.com/electron-userland/electrify).

## Hot Module Replacement

[Fast development](https://github.com/electron-userland/electron-webpack/wiki/HMR) without reloading is supported for both main and renderer processes.

## Package Scripts

You can add following scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "electron-webpack dev",
    "compile": "electron-webpack",
    "dist": "yarn compile && electron-builder",
    "dist-dir": "yarn dist -- --dir -c.compression=store -c.mac.identity=null"
  }
}
```

* `yarn dev` Run app in development.
* `yarn compile` Compile app for production. No need to call this script explicitly, only if you want to inspect your compiled app.
* `yarn dist` Build app and package in a distributable format for production.
* `yarn dist-dir` Build app and quickly package in a distributable format for test how does the app work if packed.

## Provided Configurations Files

Webpack [documentation](https://webpack.js.org/api/cli/) is fully applicable. For example, to build for production, specify `--env.production`.

* `node_modules/electron-webpack/webpack.main.config.js` Compile main.
* `node_modules/electron-webpack/webpack.renderer.config.js` Compile renderer.
* `node_modules/electron-webpack/webpack.app.config.js` Compile both main and renderer.
* `node_modules/electron-webpack/webpack.renderer.dll.config.js` Compile DLL bundles for renderer.

## Application Renderer Dependencies

All renderer dependencies should be in the `devDependencies`. e.g. `vue` and `vue-router` should be in the `devDependencies`.
Because Webpack will smartly copy only required files and as result, application size will be minimal
(electron-builder cannot do such filtering, because in general it is not applicable for node modules).
No doubt, [files](https://github.com/electron-userland/electron-builder/wiki/Options#Config-files) allows you to filter out anything you want, but it is tedious to write and maintain.

## DLL

The [Dll](https://webpack.js.org/plugins/dll-plugin/) provide means to split bundles in a way that can drastically [improve build time](https://robertknight.github.io/posts/webpack-dll-plugins/) performance.

Supported out of the box, specify in the `package.json`:
```json
"electronWebpack": {
  "renderer": {
    "dll": [
      "vue",
      "iview/dist/styles/iview.css"
    ]
  }
}
```

## White-listing Externals

Please see [White-listing Externals](https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals).
`electron-webpack` supports setting this option in the `package.json`:
```json
"electronWebpack": {
  "whiteListedModules": ["dependency-name"]
} 
```

## Differences between electron-compile

* [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) for virtually anything and even for main process. electron-compile [live reload](https://github.com/electron/electron-compile#live-reload--hot-module-reloading) is limited and works only for some file types.
* Faster Builds (e.g. [typescript](https://github.com/TypeStrong/ts-loader#faster-builds) or [generic](https://github.com/amireh/happypack)).
* No runtime dependencies.
* ... and so on. electron-compile is not comparable to [webpack](https://webpack.js.org) because webpack is widely used and popular. There are a lot features, loaders and plugins. And because community is big, answers to any question. Special tool for Electron not required, [electron](https://webpack.js.org/configuration/target/#string) is directly and explicitly supported by webpack.

But keep things simple. electron-compile offers you zero-config setup without predefined project structure and simple on the fly runtime transformation. And for simple projects, even direct usage of `typescript`/`babel` maybe enough ([example](https://github.com/develar/onshape-desktop-shell)).

So, if you doubt what to use and no suitable [boilerplate](https://github.com/electron-userland/electron-builder#boilerplates) — use [electron-compile](https://github.com/electron/electron-compile#electron-compile).
If need, later you can easily migrate to webpack.

## Notes
* [source-map-support](https://github.com/evanw/node-source-map-support) is recommended and supported out of the box, simply install it `yarn add source-map-support` and that's all.
* [webpack-build-notifier](https://github.com/RoccoC/webpack-build-notifier) is supported, simply install it `yarn add webpack-build-notifier --dev` and it will automatically enabled for development.

## Debug

Set the [DEBUG](https://github.com/visionmedia/debug#windows-note) environment variable to debug what electron-webpack is doing:
```bash
DEBUG=electron-webpack:*
```
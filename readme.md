# electron-webpack [![npm version](https://img.shields.io/npm/v/electron-webpack.svg)](https://npmjs.org/package/electron-webpack)

Configurations and scripts to compile Electron applications.

## Install

1. `yarn add webpack electron-webpack --dev`
2. `yarn add source-map-support`
3. Install support for various [languages and frameworks](https://webpack.electron.build/languages-and-frameworks) —
[TypeScript](https://webpack.electron.build/languages-and-frameworks#typescript),
[Vue.js](https://webpack.electron.build/languages-and-frameworks#vuejs),
[Less](https://webpack.electron.build/languages-and-frameworks#less) if need.

Please use [Yarn](http://yarnpkg.com/), npm is strongly not recommended.

Check out the [detailed documentation](https://webpack.electron.build).

## Differences between electron-compile

* [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) for virtually anything and [even](https://webpack.electron.build/hmr) for main process. electron-compile [live reload](https://github.com/electron/electron-compile#live-reload--hot-module-reloading) is limited and works only for some file types.
* Faster Builds (e.g. [typescript](https://github.com/TypeStrong/ts-loader#faster-builds) or [generic](https://github.com/amireh/happypack)).
* No runtime dependencies.
* ... and so on. electron-compile is not comparable to [webpack](https://webpack.js.org) because webpack is widely used and popular. There are a lot features, loaders and plugins. And because community is big, answers to any question. Special tool for Electron not required, [electron](https://webpack.js.org/configuration/target/#string) is directly and explicitly supported by webpack.

But keep things simple. electron-compile offers you zero-config setup without predefined project structure and simple on the fly runtime transformation. And for simple projects, even direct usage of `typescript`/`babel` maybe enough ([example](https://github.com/develar/onshape-desktop-shell)).

## Notes
* [source-map-support](https://github.com/evanw/node-source-map-support) is recommended and supported out of the box, simply install it `yarn add source-map-support` and that's all.
* [webpack-build-notifier](https://github.com/RoccoC/webpack-build-notifier) is supported, simply install it `yarn add webpack-build-notifier --dev` and it will automatically enabled for development.

## Debug

Set the [DEBUG](https://github.com/visionmedia/debug#windows-note) environment variable to debug what electron-webpack is doing:
```bash
DEBUG=electron-webpack*
```
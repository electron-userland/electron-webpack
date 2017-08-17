# electron-webpack [![npm version](https://img.shields.io/npm/v/electron-webpack.svg)](https://npmjs.org/package/electron-webpack)

Configurations and scripts to compile Electron applications.

## Install

1. `yarn add webpack electron-webpack --dev`
2. `yarn add source-map-support`
3. Install support for various [languages and frameworks](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks) —
[TypeScript](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#typescript),
[Vue.js](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#vuejs) and
[Less](https://github.com/electron-userland/electron-webpack/wiki/Languages-and-Frameworks#less) if need.

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

## Differences between electron-compile

* [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) for virtually anything and even for main process. electron-compile [live reload](https://github.com/electron/electron-compile#live-reload--hot-module-reloading) is limited and works only for some file types.
* Faster Builds (e.g. [typescript](https://github.com/TypeStrong/ts-loader#faster-builds) or [generic](https://github.com/amireh/happypack)).
* No runtime dependencies.
* ... and so on. electron-compile is not comparable to [webpack](https://webpack.js.org) because webpack is widely used and popular. There are a lot features, loaders and plugins. And because community is big, answers to any question. Special tool for Electron not required, [electron](https://webpack.js.org/configuration/target/#string) is directly and explicitly supported by webpack.

But keep things simple. electron-compile offers you zero-config setup without predefined project structure and simple on the fly runtime transformation. And for simple projects, even direct usage of `typescript`/`babel` maybe enough ([example](https://github.com/develar/onshape-desktop-shell)).

## Notes
* [source-map-support](https://github.com/evanw/node-source-map-support) is recommended and supported out of the box, simply install it `yarn add source-map-support` and that's all.
* [webpack-build-notifier](https://github.com/RoccoC/webpack-build-notifier) is supported, simply install it `yarn add webpack-build-notifier --dev` and it will automatically enabled for development.

## Further Reading
See the [Wiki](https://github.com/electron-userland/electron-webpack/wiki) for more documentation.

## Debug

Set the [DEBUG](https://github.com/visionmedia/debug#windows-note) environment variable to debug what electron-webpack is doing:
```bash
DEBUG=electron-webpack:*
```
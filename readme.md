# electron-webpack

Configuration and scripts to compile Electron applications that use [electron-vue](https://github.com/SimulatedGREG/electron-vue) boilerplate [project structure](https://simulatedgreg.gitbooks.io/electron-vue/content/en/project_structure.html).

## Install

`yarn add webpack electron-webpack --dev`

And install support for various [languages and frameworks](https://github.com/electron-userland/electron-webpack#languages-and-frameworks) — [typescript](#typescript), [vue](#vue) and [less](#less) if need.

[Yarn](http://yarnpkg.com/) is recommended instead of npm.

### Languages and Frameworks

To keep your `devDependencies` size minimal, only JavaScript is supported out of the box
(because even in a pure typescript project, JavaScript transpilation is required to import external dependencies on demand (e.g. ui libraries iView, Element)).

Special presets are used to ensure that you don't need to specify all required packages explicitly, — for example, `electron-webpack-ts` includes `ts-loader` and `fork-ts-checker-webpack-plugin` for you.
But if you want, you can install loaders/plugins explicitly (it will be still detected and appropriate config applied). 

### JavaScript

Supported out of the box.
Babel plugins and polyfills that you need based on your used version are determined automatically using [babel-preset-env](https://github.com/babel/babel-preset-env).

### TypeScript

`yarn add typescript electron-webpack-ts --dev`

Create `tsconfig.json` in the project root directory:

```json
{
  "extends": "./node_modules/electron-webpack/tsconfig-base.json"
}
```

If you use Vue.js, create `vue-shims.d.ts` in the `src/renderer`

```typescript
declare module "*.vue" {
  import Vue from "vue"
  export default Vue
}
```

### Vue.js

`yarn add vue electron-webpack-vue --dev`

### iView

"Import on demand" feature is supported out of the box.

### Less

`yarn add less-loader less --dev`

## Package Scripts

You can add following scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "node node_modules/electron-webpack/dev-runner.js",
    "compile": "webpack --bail --env.production --config node_modules/electron-webpack/webpack.app.config.js",
    "dist": "yarn compile && electron-builder",
    "dist-dir": "yarn compile && electron-builder --dir -c.compression=store -c.mac.identity=null"
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

Please note — due to webpack [issue](https://github.com/webpack/webpack/issues/5095), not all libraries are supported for now.

## White-listing Externals

Please see [White-listing Externals](https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals).
`electron-webpack` supports setting this option in the `package.json`:
```json
"electronWebpack": {
  "whiteListedModules": ["dependency-name"]
} 
```

## Differences between electron-compile

* [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) for virtually anything. electron-compile [live reload](https://github.com/electron/electron-compile#live-reload--hot-module-reloading) is limited and works only for some file types.
* Faster Builds (e.g. [typescript](https://github.com/TypeStrong/ts-loader#faster-builds) or [generic](https://github.com/amireh/happypack)).
* No runtime dependencies.
* ... and so on. electron-compile is not comparable to [webpack](https://webpack.js.org) because webpack is widely used and popular. There are a lot features, loaders and plugins. And because community is big, answers to any question. Special tool for Electron not required, [electron](https://webpack.js.org/configuration/target/#string) is directly and explicitly supported by webpack.

But keep things simple. electron-compile offers you zero-config setup without predefined project structure and simple on the fly runtime transformation. And for simple projects, even direct usage of `typescript`/`babel` maybe enough ([example](https://github.com/develar/onshape-desktop-shell)).

So, if you doubt what to use and no suitable [boilerplate](https://github.com/electron-userland/electron-builder#boilerplates) — use [electron-compile](https://github.com/electron/electron-compile#electron-compile).
If need, later you can easily migrate to webpack.

## Debug

Set the [DEBUG](https://github.com/visionmedia/debug#windows-note) environment variable to debug what electron-webpack is doing:
```bash
DEBUG=electron-webpack:*
```
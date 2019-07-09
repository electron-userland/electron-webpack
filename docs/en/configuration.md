As cool as `electron-webpack` can be a simple module to cover a majority of your development needs, you can also throw in your own configurations as needed. Please know that when using expected defaults, no configurations are neccessary.

Configurations can be applied in `package.json` at `electronWebpack` or in a separate `electron-webpack.(json|json5|yml)`. For the purposes of this documentation, we will use the `package.json` approach and examples will show defaults when applicable.

**Overview of available options**
```json
"electronWebpack": {
  "commonSourceDirectory": "src/common",
  "staticSourceDirectory": "src/static",
  "title": true,
  "whiteListedModules": ["foo-ui-library"],

  "main": {
    "extraEntries": ["@/preload.js"],
    "sourceDirectory": "src/main",
    "webpackConfig": "custom.webpack.additions.js"
  },

  "renderer": {
    "dll": ["fooModule"],
    "sourceDirectory": "src/renderer",
    "template": "src/renderer/index.html",
    "webpackConfig": "custom.webpack.additions.js",
    "webpackDllConfig": "custom.webpackDll.additions.js"
  }
}
```

---

### Source Directories

Defines the path to a process's or common usage directory, relative to the project's root directory. `renderer.sourceDirectory` can be `null` if you don't desire `electron-webpack` to handle bundling.

```json
"electronWebpack": {
  "commonSourceDirectory": "src/common",
  "staticSourceDirectory": "src/static",
  "main": {
    "sourceDirectory": "src/main"
  },
  "renderer": {
    "sourceDirectory": "src/renderer"
  }
}
```

### BrowserWindow Title

Defines default BrowserWindow title.
* `true` (default): Title is automatically set based on `package.json` name or `productName` when using `electron-builder`
* **String**: Use a custom string for title

```json
"electronWebpack": {
  "title": true,

  /* or */

  "title": "My Custom Title"
}
```

### Additional Entry Points for `main` process
For those situtations where you need additional [entry points](https://webpack.js.org/concepts/entry-points/). Can be useful when you need a preload script for a BrowserWindow.

```json
"electronWebpack": {
  "main": {
    "extraEntries": ["@/preload.js"]
  }
}
```
Note that you can use the `@` alias to reference your `main.sourceDirectory`.

### Dll bundle splitting
See [Dll Bundle Splitting](./dll-bundle-splitting.md) for more info.

```json
"electronWebpack": {
  "renderer": {
    "dll": ["fooModule"]
  }
}
```

### White-listing Externals
Since `webpack` is set to target the `electron` environment, all modules are treated as [externals](https://webpack.js.org/configuration/externals/). Unfortunately, there can be a few situations where this behavior may not be expected by some modules. For the case of some Vue UI libraries that provide raw `*.vue` components, they will needed to be white-listed. This ensures that `vue-loader` is able to compile them as the UI library originally expected.

```json
"electronWebpack": {
  "whiteListedModules": ["foo-ui-library"]
}
```

### Modified Webpack Configurations
See [Modifying Webpack Configurations](modifying-webpack-configurations.md) for more information.

```json
"electronWebpack": {
  "main": {
    "webpackConfig": "custom.additions.webpack.js"
  },

  "renderer": {
    "webpackConfig": "custom.additions.webpack.js",
    "webpackDllConfig": "custom.additions.webpack.js"
  }
}
```

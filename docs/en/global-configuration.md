# Global Configuration

As cool as `electron-webpack` can be a simple module to cover a majority of your development needs, you can also throw in your own configurations as needed.

Global configurations can be applied in `package.json` at `electronWebpack` or in a separate `electron-webpack.(json|json5|yml)`. For the purposes of this documenation, we will use the `package.json` approach.

**Overview of available options**
```json
"electronWebpack": {
  "title": true,

  "whiteListedModules": ["foo-ui-library"],

  "main": {
    "sourceDirectory": "src/main",
    "extraEntries": ["@/preload.js"]
  },

  "renderer": {
    "sourceDirectory": "src/renderer",
    "dll": ["fooModule"]
  }
}
```

### Source Directories


```json
"electronWebpack": {
  "main": {
    "sourceDirectory": "path/to/src/main"
  },
  "renderer": {
    "sourceDirectory": "path/to/src/renderer"
  }
}
```

### BrowserWindow Title


```json
"electronWebpack": {
  "title": true
}
```

### Additional Entry Points for `main` process
For those situtations where you need additional [entry points](https://webpack.js.org/concepts/entry-points/).

```json
"electronWebpack": {
  "main": {
    "extraEntries": ["@/preload.js"]
  }
}
```
Note that you can use the `@` alias to reference your `main.sourceDirectory`.

### Dll bundle splitting
If you are unfamiliar with the `webpack.DllPlugin`, make sure to read its [documenation](https://webpack.js.org/plugins/dll-plugin/) to better understand what problem it attempts to solve. In short, this can be used to [drastically improve](https://robertknight.github.io/posts/webpack-dll-plugins/) build time performance.

```json
"electronWebpack": {
  "renderer": {
    "dll": ["fooModule"]
  }
}
```

### White-listing Externals
Since `webpack` is set to target the `electron` environment, all modules are treated as [externals](https://webpack.js.org/configuration/externals/). Unfortunately, there can be a few situations where this behavior may not be expected by some modules. For the case of Vue UI libraries that provide raw `*.vue` components, they will needed to be whitelisted. This ensure that `vue-loader` is able to compile them as the module originally expected.

```json
"electronWebpack": {
  "whiteListedModules": ["foo-ui-library"]
}
```


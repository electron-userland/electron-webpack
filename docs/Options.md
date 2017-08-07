electron-webpack configuration can be defined in the `package.json` file of your project using the `build` key on the top level:
 ```json
 "electronWebpack": {
   "title": true
 }
   ```

## Browser Window Title

`title` String (optional) - Default window title. Set to `true` to automatically set to package name (or product name in the electron-builder).

By default, `title` tag is not added to html template. Because:

1. `title` [BrowserWindow](https://github.com/electron/electron/blob/master/docs/api/browser-window.md) option doesn't work unless `page-title-updated` event is not prevented.
2. Title defaults to your app name when packed (electron-builder correctly configures app manifest).

So, the only drawback, — in a dev mode, title defaults to `Electron`. But, often, you in any case explicitly set title to something app specific.

If you decided to set title in the electron-webpack options, you still can update it in the runtime:

```js
mainWindow = new BrowserWindow({
  title: `Custom Runtime Title`,
})

mainWindow.on("page-title-updated", event => {
  event.preventDefault()
})
```

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
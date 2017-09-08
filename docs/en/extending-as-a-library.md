# Extending as a Library

One of the great benefits of using `electron-webpack` is that the entirity of `webpack`'s documenation still applies. You can easily skip using the provided CLI and modify the configurations to meet your needs. Since `electron` uses a multi-process architecture, there are also multiple `webpack` configurations. Let's cover what's provided.

### Configuration Files

* `electron-webpack/webpack.main.config.js` (`main` process)
* `electron-webpack/webpack.renderer.config.js` (`renderer` process)
* `electron-webpack/webpack.renderer.dll.config.js` (Dll bundle spliting)
* `electron-webpack/webpack.app.config.js` (combination of all configurations above)

If you are wanting to look at these configurations internally, you can easily do the following to print them into your console. Notice that each configuration returns a `Promise`.

```js
const webpackMain = require('electron-webpack/webpack.main.config.js')
const { inspect } = require('util')

webpackMain().then(config => {
  console.log(inspect(config, {
    showHidden: false,
    depth: null,
    colors: true
  }))
})
```

## Adding a Custom Loader/Plugin

Let's say we need to support `*.txt` files in our `renderer` process and want to use the `raw-loader` to do so, here's how we can get that setup.

##### Install `raw-loader`
```bash
yarn add -D raw-loader
```

##### myCustomWebpack.main.config.js
```js
const webpackRenderer = require('electron-webpack/webpack.renderer.config.js')

module.exports = env => {
  return new Promise((resolve, reject) => {

    /* get provided config */
    webpackRenderer(env).then(mainConfig => {

      /* add `raw-loader` */
      mainConfig.module.rules.push({
        test: /\.txt$/,
        use: 'raw-loader'
      })

      /* return modified config to webpack */
      resolve(mainConfig)
    })
  })
}
```

Now with your new custom webpack configuration file, you can use the native [`webpack` CLI](https://webpack.js.org/api/cli/).

```bash
webpack --config myCustomWebpack.main.config.js
```

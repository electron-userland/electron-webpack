# Modifying Webpack Configurations

Another great benefit of using `electron-wepback` is that you are never restricted to an abstracted API. Of course there isn't a configuration that fits everybody's need, and `electron-webpack` is aware of that.

Thanks to the power of `webpack-merge`, it is possible to apply your own webpack loaders, plugins, etc. You can easily define your own webpack additions, and `electron-webpack` will internally merge those additions with its predefined configuration. The benefit of using this method, as opposed to [Extending as a Library](extending-as-a-library.md), is that you don't lose access to using the `electron-webpack` CLI, which is very beneficial for development.

Custom modifications can be made for the `renderer`, `renderer-dll`, and `main` processes. Since `webpack-merge` is used, you can use the full potential of `webpack`'s configuration API. See [Configuration](configuration.md) for more information.

### Use Case
Let's say our project needs to be able to import `*.txt` files in the `renderer` process. We can use `raw-loader` to get that done.

##### Install `raw-loader`
```bash
yarn add raw-loader --dev
```

##### Define `raw-loader`
Notice that the full `webpack` API is usable and not blocked. You could also defined other loaders and plugins here. Please know that making major modifications may break expected behavior.
```js
/* webpack.renderer.additions.js */

module.exports = {
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: 'raw-loader'
      }
    ]
  }
}
```

##### Define custom configurations
See [Configuration](configuration.md) for more information.
```json
{
  "electronWebpack": {
    "renderer": {
      "webpackConfig": "webpack.renderer.additions.js"
    }
  }
}
```

Now when running `electron-webpack`'s CLI, your custom additions will be loaded in and you can use them as expected. If you need even more control over the configuration, then maybe [Extending as a Library](extending-as-a-library.md) can better suit your needs.

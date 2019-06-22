# Modifying Webpack Configurations

Another great benefit of using `electron-wepback` is that you are never restricted to an abstracted API. Of course there isn't a configuration that fits everybody's need, and `electron-webpack` is aware of that.

Custom modifications can be made for the `renderer`, `renderer-dll`, and `main` processes. 
Notice that the full `webpack` API is usable and not blocked. You could add any loaders and plugins, but keep in mind that making major modifications may break expected behavior.

There are currently two methods of modifying the webpack configuration: 

- [Using a config object](#using-a-config-object)  
- [Using a config function](#using-a-config-function)

The benefit of using either method, as opposed to [Extending as a Library](extending-as-a-library.md), is that you don't lose access to the `electron-webpack` CLI, which is very beneficial for development.

## Using a config object

Thanks to the power of [webpack-merge](https://github.com/survivejs/webpack-merge), it is possible to add your own webpack loaders, plugins, etc, by simply providing a config object that will be automatically merged on top of the predefined configuration using the [smart merging strategy](https://github.com/survivejs/webpack-merge#smart-merging).
 

### Use Case

Let's say our project needs to be able to import `*.txt` files in the `renderer` process. We can use `raw-loader` to get that done.


#### Install `raw-loader`

```bash
yarn add raw-loader --dev
```

#### Configure `electron-webpack`

Provide a configuration for `electron-webpack`, for example in your `package.json` file, and point it to a custom webpack config file for the renderer process:
```json
{
  "electronWebpack": {
    "renderer": {
      "webpackConfig": "webpack.renderer.additions.js"
    }
  }
}
```
See [Configuration](configuration.md) for more information.
 
#### Configure `raw-loader`

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


Now when running `electron-webpack`'s CLI, your custom additions will be loaded and you can use them as expected.

This is a very convenient way to add configuration on top of the defaults, but it has some limitations when it comes to modifying defaults or even removing parts of the configuration.

If you need more control over the configuration, then maybe a [config function](#using-a-config-function) or [Extending as a Library](extending-as-a-library.md) can better suit your needs.

## Using a config function

Beginning with version 2.7.0, `electron-webpack` supports configuration modules that export a function instead of an object.

In this case, the config function you provide will be invoked with the default config object as an argument, and it is expected to return the final config object.  

You may modify the default object using any method you like, for example you could iterate over loaders or plugins and remove or replace some of them. You could use a tool like `webpack-merge` manually, or you could even create and return an entirely new object if that suits your needs.


### Use Case

Let's say you would like the `css-loader` to treat everything as [CSS modules](https://github.com/webpack-contrib/css-loader#modules) and implicitly convert all classnames to hashed variants, unless you defined them as `:global` explicitly. 

First, configure `electron-webpack` to use your custom config file.
 
Note that while the filename technically doesn't matter, we do not use "additions" in the name as we did before, as this config file provides more than just additions.

```json
{
  "electronWebpack": {
    "renderer": {
      "webpackConfig": "webpack.renderer.js"
    }
  }
}
```
See [Configuration](configuration.md) for more information.

Next, provide your custom configuration file:

```js
/* webpack.renderer.js */
module.exports = function(config) {
  const styleRules = config.module.rules.filter(rule =>
    rule.test.toString().match(/css|less|s\(\[ac\]\)ss/)
  )

  styleRules.forEach(rule => {
    const cssLoader = rule.use.find(use => use.loader === 'css-loader')
    // this is the actual modification we make:
    cssLoader.options.modules = 'local'
  })

  return config
}
```

As you can see, instead of exporting an object, we export a function.  
The function receives the webpack config object, simply modifies it in certain places and then returns it again.

When in doubt about the structure of the config object, you can either get familiar with the [sources that define it](https://github.com/electron-userland/electron-webpack/tree/master/packages/electron-webpack/src/targets) or simply try a quick `console.log(config)` inside of the function.  
Or better yet, try `console.log(JSON.stringify(config, null, 4))` to reveal all the nested values in a readable format.

If you need even more control over the configuration, then maybe [Extending as a Library](extending-as-a-library.md) can better suit your needs.

One great feature of using `webpack` is being able to take advantage of the `webpack.DllPlugin` plugin. If you are unfamiliar with the `webpack.DllPlugin` plugin, make sure to read its [documentation](https://webpack.js.org/plugins/dll-plugin/) to better understand what problem it attempts to solve. In short, this can be used to [drastically improve](https://robertknight.github.io/posts/webpack-dll-plugins/) build time performance.

Through custom configurations `electron-webpack` provides a place to define specific packages you would like to create a separate bundle for. You can treat this feature as a way to bundle all of your *vendor* libraries together.

Once you have defined your modules, you can simply run `electron-webpack dll` to produce a `vendor` bundle that will be referenced in your final compilation. Let's go through that step-by-step.

### Define your modules
Here we are defining our modules in `package.json`. If you prefer, you can also create a separate file for your configurations ([more info](./configuration.md)).
```json
{
  "electronWebpack": {
    "renderer": {
      "dll": [
        "fooModule",
        "barModule"
      ]
    }
  }
}
```

### Create the `vendor` bundle
Once you have choosen your selected modules, you can run the below command to create your `vendor` bundle.

```bash
electron-webpack dll
```

It may be beneficial to create a `package.json` script for this command if you plan to use it often.

```json
{
  "scripts": {
    "compile:dll": "electron-webpack dll"
  }
}
```

## Final Notes
Now that your `vendor` bundle is created, you can move forward with the standard `electron-webpack` compilation process.

Please know that the `vendor` bundle is only created when you explicity run `electron-webpack dll`. For most cases, you may only need to run this one time. But as you add/remove modules or even update those modules, you will need to re-run the command to create an updated bundle.

#### Using a `postinstall` hook
One common practice when using Dll bundle splitting to define a `postinstall` command to create the `vendor` bundle whenever new dependecies are installed. This can help ensure everything is up to date so you don't have to manually run this yourself.

```json tab="package.json"
{
  "scripts": {
    "postinstall": "electron-webpack dll"
  }
}
```

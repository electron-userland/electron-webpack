# Building

One important thing to understand is that `electron-webpack` is agnostic about the build tool you decide to use for creating your distributable `electron` application. The only concern of this module is to create a `webpack` output that functions properly and is optimized for the `electron` enviroment.

### Compiling your code

Once you have `electron-webpack` configured for your project, you can simply run the `electron-webpack` command to compile your source code. To make things easier, make use of setting up a script in your `package.json`.

```json
{
  "scripts": {
    "compile": "electron-webpack"
  }
}
```

After running the above script with `yarn compile`, you now have a `webpack` output located in the `dist/` directory.

### Building a distribution

Now that `electron-webpack` has created your `webpack` bundle, you can simple implement any build tool you would like. One thing to note is that additional optimizations have been made to work with [`electron-builder`](https://github.com/electron-userland/electron-builder). This build tool is perfect for any sized application, providing many features from creating installable executables to "auto update" support.

When configuring your build tool, just be sure to point to the `dist/` directory where your compiled application lives. Any issues that may arise during the build step should be directed towards the respected build tool, and not `electron-webpack`.

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

  `NODE_ENV` environment variable is ignored. To disable minification, pass `--env.minify=false`. To build for development, pass `--env.production=false`.
* `yarn dist` Build app and package in a distributable format for production.
* `yarn dist-dir` Build app and quickly package in a distributable format for test how does the app work if packed.
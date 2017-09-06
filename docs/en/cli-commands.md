# CLI Commands

`electron-webpack` comes with a simple CLI to help run your application in development and compile your source code. Here is a general overview of what's available.

#### `electron-webpack dev`
Run application in development mode.

#### `electron-webpack [config]`
Compile source code of specific configuration. Can be `main`, `renderer`, `renderer-dll`, or `app` (default).

#### `electron-webpack --help`
Yields quick overview of all CLI features.

---

### Package Scripts
To make things easier, make use of setting up scripts in your `package.json` to use the CLI easier.

##### package.json
```json
{
  "scripts": {
    "dev": "electron-webpack dev",
    "compile": "electron-webpack"
  }
}
```

Now you can run with `yarn dev` & `yarn compile`.

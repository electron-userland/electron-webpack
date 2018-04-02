# Development

### Installation
Since `electron-webpack` is a module, not a boilerplate, let's install that and few other dependencies.

```bash
yarn add electron-webpack electron webpack --dev
yarn add source-map-support
```

### Starting in development mode
By default, `electron-webpack` expects, at minimum, a `main` process entry point in `src/main/index.js` ([more info](./project-structure.md)). Once you have your entry files setup, you can run `electron-webpack dev` to get started. To make things easier, make use of setting up a script in your `package.json` to start your application in development mode.

```json
{
  "scripts": {
    "dev": "electron-webpack dev"
  }
}
```

If you are using [`electron-webpack-quick-start`](https://github.com/electron-userland/electron-webpack-quick-start) and have already installed dependecies, simply run the follwing to open your application in development mode.
```bash
yarn dev
```

---

### Source Aliases

`electron-webpack` provides a few [source aliases](https://webpack.js.org/configuration/resolve/#resolve-alias), or [path mappings](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) as TypeScript would call it, that allow you to import your modules easier.

* `@`: Provides path to corresponding process (`main` or `renderer`)
* `common`: Provides path to common source directory


---

### A little note on the *magic*
`electron-webpack` may seem like a **magical** module to some from the outside, but let's cover a few topics about what's going on *under the hood*.

##### Hot Module Replacement
Webpack HMR has been setup to support both the `renderer` and `main` process. This allows for faster development ensuring your application is only restarted when neccessary.

##### Bundling for both `renderer` and `main` processes
`webpack` is already setup to have an entry point for each process. In addition, you can also easily add further entry points to the `main` process when needed. In the other cases where you just need support for the `main` process, you can even skip the `renderer` process when needed ([more info](./configuration.md#source-directories)).

##### Use of `html-webpack-plugin`
You might notice that you don't need an `index.html` to get started on your application. That's because it is created for you, as it adds in a few extra configurations needed for the `electron` environment. If you are creating an `electron` application with `webpack`, you are most likely creating a Single Page Application anyways. So because of that, there is already a `<div id="app"></div>` provided in the markup that you can mount your application onto.

---

#### A Note for Windows Users

If you run into errors while installing dependencies, related to `node-gyp`, then you most likely do not have the proper build tools installed on your system. Build tools include items like Python and Visual Studio.

You can quickly install these build tools by globally installing [`windows-build-tools`](https://github.com/felixrieseberg/windows-build-tools). It provides many items like Visuall C++ packages, Python, and much more.

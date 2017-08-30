# Development

### Installation
Since `electron-webpack` is a module, not a boilerplate, let's install that and few other dependencies.

```bash
yarn add -D electron-webpack electron webpack
yarn add source-map-support
```

### Starting in development mode
By default, `electron-webpack` expects, at minimum, a `main` process entry point in `src/main/index.js` ([more info]()). Once you have your entry files setup, you can run `electron-webpack dev` to get started. To make things easier, make use of setting up a script in your `package.json` to start your application in development mode.

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

### A little note on the *magic*
`electron-webpack` may seem like a **magical** module to some from the outside, but let's cover a few topics about what's going on *under the hood*.

##### Hot Module Replacement
Webpack HMR supports both the `renderer` and `main` process. This allows for faster development ensuring your application is only restarted when neccessary.

##### Bundling for both `renderer` and `main` processes
`webpack` is already setup to have an entry point for each process. In addition, you can also easily add further entry points to the `main` process when needed. In the other cases where you just need support for the `main` process, you can even skip the `renderer` process when needed ([more info]()).

##### Use of `html-webpack-plugin`
You might notice that you don't need an `index.html` to get started on your application. That's because it is created for you, as it adds in a few extra configruations needed for the `electron` environment. If you are creating an `electron` application, you are most likely creating a Single Page Application anyways. Creating a new DOM element is a [single line of JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) away to help mount your application.



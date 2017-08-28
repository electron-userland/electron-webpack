# Development

### Starting in development mode
After you have installed dependencies, simply run the following to open your application in development mode.

```bash
yarn dev
```

---

### A little note on the *magic*
`electron-webpack` may seem like a **magical** module to some from the outside, but let's cover what's going on under the hood.

#### Hot Module Replacement
Webpack HMR supports both the `renderer` and `main` process. This allows for faster development ensuring your application is only restarted when neccessary.

#### Bundling for both `renderer` and `main` processes
`webpack` is already setup to have an entry point for each process. In addition, you can also easily add further entry points when needed. In the other cases where you just need support for the `main` process, you can even skip the `renderer` process when needed.

#### Use of `html-webpack-plugin`
You might notice that you don't need an `index.html` to get started on your application. That's because it is created for you, as it adds in a few extra configruations needed for the `electron` environment. If you are creating an `electron` application, you are most likely creating a Single Page Application anyways.



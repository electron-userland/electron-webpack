# electron-webpack [![npm version](https://img.shields.io/npm/v/electron-webpack.svg)](https://npmjs.org/package/electron-webpack)

> Because setting up `webpack` in the `electron` environment shouldn't be difficult.

## Overview
Modern web development practices today require a lot of setup with things like `webpack` to bundle your code, `babel` for transpiling, `eslint` for linting, and so much more that the list just goes on. Unfortunaly when creating `electron` applications, all of that setup just became much more difficult. The primary aim of `electron-webpack` is to eliminate all preliminary setup with one simple install so you can get back to developing your application.

> Why create a module and not a full boilerplate?

If you've been in the JavaScript world for even a short period of time, you are very aware that things are always changing, and development setup is no exclusion. Putting all development scrtips into a single **updatable** module just makes sense. Sure a full featured boilerplate works to, but doing also involves needing to manually update those pesky `webpack` configuration files that some may call *magic* when something new comes out.

Here are some of the awesome features you'll find using `electron-webpack`...

* Detailed [documentation](https://webpack.electron.build)
* Use of [`webpack`](https://webpack.js.org/) for source code bundling
* Use of [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server) for development
* HMR for both `renderer` and `main` processes
* Use of [`babel-preset-env`](https://github.com/babel/babel-preset-env) that is automatically configured based on your `electron` version
* Support for pre-proccessors like [TypeScript](http://www.typescriptlang.org/), [Less](http://lesscss.org/), & [EJS](http://www.embeddedjs.com/)

## Quick Start
#### Setup basic project structure
```
my-project/
├─ src
│  ├─ main # main process sources
│  │  └─ index.js
│  ├─ renderer # renderer process sources*
│  │  └─ index.js
│  └─ common # common sources*
└─ static # static assets*
```
\* Denotes an **optional** directory

#### Install dependencies
The use of the [yarn](https://yarnpkg.com/) package manager is strongly recommended, as opposed to using `npm`.

```bash
yarn init
yarn add -D webpack electron-webpack
```

#### Add development scripts
package.json
```json
"scripts": {
  "dev": "electron-webpack dev",
  "compile": "electron-webpack",
  "dist": "yarn compile && electron-builder",
  "dist-dir": "yarn dist -- --dir -c.compression=store -c.mac.identity=null"
}
```

#### Launch application
```bash
yarn dev
```

### Next Steps
Make sure to take advantage of the detailed [documentation](https://webpack.electron.build) that `electron-webpack` provides. It covers everything from how things work internally, further configurations, and building your application.

---

### Technical differences between `electron-compile`
// TODO

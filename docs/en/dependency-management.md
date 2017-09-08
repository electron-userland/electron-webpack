# Dependency Management

When creating `electron` applications, dependency management can be a little different for specific cases. To make sure everybody is on the same page, make sure to take a look at the below documentation.

### Using `yarn`

As previously mentioned, the use of the [`yarn`](https://yarnpkg.com) package manager is **strongly** recommened, as opposed to `npm`. Aside from a more stable dependency tree, one other major benefit to using `yarn` is the ability to [*clean*](https://yarnpkg.com/en/docs/cli/clean) your `node_modules` to help eliminate redudant files that will help reduce your application's final build size.

### package.json
#### `dependencies`

These dependencies **will** be included in your final production application. If your application needs a certain module to function, then install it here!

#### `devDependencies`
These dependecies **will not** be included in your final production application. Here you can install modules needed specifically for development, like build scripts, task runners, `webpack` accessories, etc.

### Installing Native Node Modules

When using native node modules, those written in C/C++, we need to ensure they are built against `electron`'s packaged `node` version. We can use [`electron-rebuild`](https://github.com/electron/electron-rebuild) to rebuild any modules causing conflicts.

If you do expect to use native node modules, it is highly recommened to use [`electron-builder`](https://github.com/electron-userland/electron-builder) for your build tool as it handles these conflicts for you during the build step.

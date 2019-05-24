# Dependency Management

When creating `electron` applications, dependency management can be a little different for specific cases. To make sure everybody is on the same page, make sure to take a look at the below documentation.

### Using `yarn`

As previously mentioned, the use of the [`yarn`](https://yarnpkg.com) package manager is **strongly** recommended, as opposed to `npm`. Aside from a more stable dependency tree, one other major benefit to using `yarn` is the ability to [*clean*](https://yarnpkg.com/en/docs/cli/clean) your `node_modules` to help eliminate redudant files that will help reduce your application's final build size.

### package.json
#### `dependencies`

These dependencies **will** be included in your final production application. If your application needs a certain module to function, then install it here!

#### `devDependencies`
These dependecies **will not** be included in your final production application. Here you can install modules needed specifically for development, like build scripts, task runners, `webpack` accessories, etc.

### Installing Native Node Modules

When using native node modules, those written in C/C++, we need to ensure they are built against `electron`'s packaged `node` version. We can use [`electron-builder`](https://www.electron.build/cli)'s `install-app-deps` command to rebuild those modules to resolve any conflicts we might run into.

##### Running `install-app-deps`
```bash
yarn add electron-builder --dev
./node_modules/.bin/electron-builder install-app-deps
```

It may also be worth adding a `package.json` script for this command if you plan on using it often (`yarn rebuild-deps`).

```json
{
  "scripts": {
    "rebuild-deps": "electron-builder install-app-deps"
  }
}
```

If you choose not to use `electron-builder` as your build tool, you can still run the command using `npx` without side affects.

```bash
# Using `npm@^5.2.0`
npx electron-builder install-app-deps
```

#### Final Notes
If you do expect your application to use native node modules, it is **highly recommended** to use [`electron-builder`](https://github.com/electron-userland/electron-builder) for your build tool as it handles these conflicts for you during the build step.

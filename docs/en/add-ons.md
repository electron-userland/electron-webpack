# Add-ons

Although `electron-webpack` is provided as a single module, you can also install add-ons. Add-ons are made available to help setup certain frameworks that may require a lot of extra configuration or dependencies, such as TypeScript or Vue.js.

These add-ons are completely optional and may not support all use cases. If you need something more custom, please know that the entirety of `webpack`'s documenation still applies to `electron-webpack` ([more info]()).

**Current Add-ons**
* [JavaScript Frameworks]()
  * [Vue.js]()
  * [React JSX]()
* [Pre-processors]()
  * [ESLint]()
  * [TypeScript]()
  * [Less]()
  * [Sass/SCSS]()
  * [EJS]()
  * [Nunjucks]()
* [UI Libraries]()
  * [iView]()
* [Miscellaneous]()
  * [Build Notifications]()

---

## JavsScript Frameworks

### Vue.js
Adds support for Vue component files through the use of `vue-loader`. In addition, `vue-devtools` will also be installed for development purposes.

##### Install
```bash
yarn add -D vue electron-webpack-vue
```

#### Adding TypeScript support
Install the [TypeScript]() add-on, followed by adding the below file to shim Vue component files.

#### `src/renderer/vue-shims.d.ts`
```ts
declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}
```

And of course, make sure to let `vue-loader` know you want to use TypeScript in your component file using the `lang="ts"` attribute.

```html
<template></template>

<script lang="ts">
  /* your TypeScript code */
</script>

<style></style>
```

#### Adding ESLint support
Install the [ESLint]() add-on, install `eslint-plugin-html`, and add the following additional configurations.

#### Install `html` plugin to lint Vue component files
```bash
yarn add -D eslint-plugin-html
```

#### `.eslintrc.js`
```js
module.exports = {
  parser: 'babel-eslint',
  plugins: [
    'html'
  ]
}
```

### React JSX
Add support for compiling JSX files.

```bash
yarn add -D babel-preset-react
```

---

## Pre-processors

### ESLint
Add support for script file linting using `eslint`. Internally uses `eslint`, `eslint-loader`, `eslint-friendly-formatter`, and makes `babel-eslint` available if needed.

##### Install
```bash
yarn add -D electron-webpack-eslint
```

##### Create `.eslintrc.js` in root directory
```js
module.exports = {
  /* your base configuration of choice */
  extends: 'eslint:recommended',

  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  globals: {
    __static: true
  }
}
```

### TypeScript
Add support for compiling TypeScript script files. Internally uses both `ts-loader` and `fork-ts-checker-webpack-plugin` to compile `*.ts`. Note that entry files can also use the `*.ts` extension.

##### Install
```bash
yarn add -D typescript electron-webpack-ts
```

#### Create `tsconfig.json` in root directory
```json
{
  "extends": "./node_modules/electron-webpack/tsconfig-base.json"
}
```

### Less
Add support for compiling Less style files.

##### Install
```bash
yarn add -D less less-loader
```

### Sass/SCSS
Add support for compiling Sass/SCSS style files.

##### Install
```bash
yarn add -D node-sass sass-loader
```

### EJS
Add support for compiling EJS template files.

##### Install
```bash
yarn add -D ejs ejs-html-loader
```

### Nunjucks
Add support for compiling Nunjucks template files.

##### Install
```bash
yarn add -D nunjucks nunjucks-loader
```

---

## UI Libraries

### iView
Once you have the [Vue.js]() add-on installed, `electron-webpack` will internally support iView's "import on demand" feature. No further setup is necessary.

---

## Miscellaneous

### Build Notifications
Provide OS-level notifications on the `webpack` build.

##### Install
```bash
yarn add -D webpack-build-notifier
```

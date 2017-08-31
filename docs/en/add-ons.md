# Add-ons

Although `electron-webpack` is provided as a single module, you can also install add-ons. Add-ons are made available to help setup certain frameworks that may require a lot of extra configuration or dependencies, such as TypeScript or Vue.js.

These add-ons are completely optional and may not support all use cases. If you need something more custom, please know that the entirety of `webpack`'s documenation still applies to `electron-webpack` ([more info]()).

**Current Add-ons**
* [TypeScript]()
* [Vue.js]()

---

### TypeScript
Adds support for TypeScript. Internally uses both `ts-loader` and `fork-ts-checker-webpack-plugin` to compile `*.ts` files found within `src/**/*`. Note that entry files can also use the `*.ts` extension.

##### Install
```bash
yarn add -D typescript electron-webpack-ts
```

##### Create `tsconfig.json` in root directory
```json
{
  "extends": "./node_modules/electron-webpack/tsconfig-base.json"
}
```

### Vue.js
Adds support for Vue component files through the use of `vue-loader`. In addition, `vue-devtools` will also be installed for development purposes.

##### Install
```bash
yarn add -D vue electron-webpack-vue
```

##### Adding TypeScript support
Install the [TypeScript]() add-on, followed by adding the below file to shim Vue component files.

##### `src/renderer/vue-shims.d.ts`
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

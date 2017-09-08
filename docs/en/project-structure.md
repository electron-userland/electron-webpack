# Project Structure

Everybody likes to structure their projects differently, and `electron-webpack` is aware of that. For the most part, the only configurations needed are [entry points](https://webpack.js.org/concepts/entry-points/) for `webpack` to step in.

If you are looking to follow common electron practices or wanting an example template, make sure to check out [`electron-webpack-quick-start`](https://github.com/electron-userland/electron-webpack-quick-start). It has the bare minimun setup, but can be easily modified to meet many needs. The use of this template, of course, is optional.

### Default Structure
Below is the default file tree that `electron-webpack` expects without any custom configuration. Please know that source directories can be adjusted to meet your needs ([more info](./configuration.md)).

```
my-project/
├─ src/
│  ├─ main/
│  │  └─ index.js
│  ├─ renderer/
│  │  └─ index.js
│  └─ common/
└─ static/
```

##### Main Process (`src/main/`)
Here you can add all of your `main` process code.

##### Renderer Process (`src/renderer/`) [optional]
Here you can add all of your `renderer` process code. Bundling of the `renderer` process is optional for cases where you may want to use an external tool such as [`electron-next`](https://github.com/leo/electron-next). Notice that there isn't a entry `index.html`, that's because it is created for you ([more info](./development.md)).

##### Common Scripts (`src/common/`) [optional]
This is a convenient place where you can place utility type files that you expect to use between both processes. Thanks to `webpack` aliasing, you can easily import files from here using the `common` alias.

##### Static Assets (`static/`) [optional]
There are some instances were we may not want `webpack` to bundle particular assets, like those being consumed by modules like `fs`. Here is where we can put them and then reliably access them in both development and production ([more info](./using-static-assets.md)).

### `webpack` entry points
One important thing to notice is that `electron-webpack` expects that your `main` process and `renderer` process source code is separated using different directories.
Within each process's directory, one of the following entry files is expected...

* `index.js` / `main.js`
* `index.ts` / `main.ts` (when using the [TypeScript](./add-ons.md) add-on)

The [entry files](https://webpack.js.org/concepts/entry-points/) are the main starting point of your `webpack` bundle, so everything found within its dependency tree will be bundled.

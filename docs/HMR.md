Please see [Electron — very fast developer workflow with Webpack HMR](https://medium.com/@develar/electron-very-fast-developer-workflow-with-webpack-hmr-e2a2e23590ad). 

## Watch Ignores

Following directories are excluded and don't trigger recompilation in a watch mode:

* `build`
* `dist`
* `node_modules`
* `static`
* `.idea`
* `.vscode`
* source directory for other process (`src/renderer` is ignored for `main` and vice versa).
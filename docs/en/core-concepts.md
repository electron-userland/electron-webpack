# Core Concepts

Below is a general overview of what `electron-webpack` aims to solve, and what it isn't.

#### `electron-webpack` is a module
It is not a fully featured boilerplate; it is a single **updatable** package. It includes many `webpack` configurations to help jump-start your development needs. If you are looking for a *boilerplate* to get started, please see [electron-webpack-quick-start](https://github.com/electron-userland/electron-webpack-quick-start).

#### `electron-webpack` has a CLI
You can take use of a few useful commands such as running in development and compiling you source code ([more info](./cli-commands.md)).

#### `electron-webpack` can be extended
By using `electron-webpack` you are **not** restricted to any sort of API abstraction of `webpack`. Although there are [Add-ons](./add-ons.md) made available to simplify smaller tasks, the entirety of `webpack`'s documentation is fully applicable ([more info](./extending-as-a-library.md)).

#### `electron-webpack` is agnostic
Aside from setting up core `webpack` configurations with `babel-preset-env` and making optimizations specific to the `electron` environment, `electron-webpack` does its best to not impose or encourage any sort of project structure or build cycle. Just as stated before, this is a module and can be used as tool outside of its CLI.

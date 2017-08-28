# Core Concepts

Below is a general overview of what `electron-webpack` aims to solve, and what it isn't.

#### `electron-webpack` is a module
It is not a fully featured boilerplate; it is a single **updatable** package. It includes many `webpack` configurations to help jump-start your development needs.

#### `electron-webpack` has a CLI
You can take use of a few useful commands such as running in development and compiling you source code. [link to docs]

#### `electron-webpack` can be extended
By using `electron-webpack` you are **not** restricted to any sort of API abstraction of `webpack`. Although there are configurations made available to simplify smaller tasks, the entirety of `webpack`'s documentation is fully applicable.

#### `electron-webpack` is agnostic
Aside from setting up core `webpack` configurations with `babel-preset-env` and making optimizations specific to the `electron` environment, `electron-webpack` does its best to not impose or encourage any sort of project structure or build cycle. Just as stated above, this is a module and can be used as tool outside of its CLI.

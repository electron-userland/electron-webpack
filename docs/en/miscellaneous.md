# Miscellaneous

### Technical Differences between `electron-compile`
> Electron supporting package to compile JS and CSS in Electron applications

`electron-compile` is a great package that offers a *zero configuration* setup without a predefine project structure. It surely has its place in the community, but just isn't comparable to `webpack` in terms of flexibility, development experience, and community extensions. Below are a few topics on why `electron-webpack` can be considerably better.

##### Hot Module Replacement
`electron-webpack` provides HMR for virtually all code in both `main` and `renderer` processes. `electron-compile` is currently limited to [live reloading](https://github.com/electron/electron-compile#live-reload--hot-module-reloading), which is enough for certain enviroments, but works for only a handful of file types. If you've worked with HMR before, then you definitly know it is something you can not live without afterwards.

##### Runtime Dependencies
Since `electron-compile` "compiles JS and CSS on the fly", it currently adds extra dependencies into the scope of your project. Sure, a small handful of modules isn't a big deal, but keeping production size down in the end is **always** important when distributing `electron` applications.

##### Faster Build Times
Internally, `electron-webpack` takes advantage of [`happypack`](https://github.com/amireh/happypack) to create multiple worker *threads*. Combined with Dll support, build times can be [significatly faster](https://github.com/amireh/happypack#benchmarks). It even has some additional optimizations for TypeScript users. And let's be honest, especially for large-scale applications, who doesn't want faster build times?

##### Webpack Community
When using `electron-compile` you are limited to a specific set of features. Sure you have most of the important ones covered, you just don't get an amazing and large community that `webpack` can provide. There are countless loaders and plugins to cover just about everything you may ever need. Not only is the community constantly implementing new tools, `electron` is explicitly support by the `webpack` team.

In the end, `electron-compile` is still a fantastic tool when you need to quickly prototype a project together. It can even be enough for smaller scale applications that may not need all the fancy bells and whistles.

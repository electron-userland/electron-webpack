Sometimes you need your `webpack` build to be dependent upon specific environment variables. Whether you need to set a global API Url or even the application name, here's how you can set variables that `electron-webpack` will provide for your application.

### `ELECTRON_WEBPACK_APP_*`

If you want `electron-webpack` to provide environment variables during the build process, use the `ELECTRON_WEBPACK_APP_*` namespace and they will be injected.

#### Use Case

Let's say our application uses a CI server to run tests, and we also want that build to use our development API. We can set an environment variable to define the base Url that [`axios`](https://www.npmjs.com/package/axios) can use.

##### Set our environment variable
```bash
# linux and darwin systems
ELECTRON_WEBPACK_APP_API_URL="http://dev.domain.com/api"

# win32 systems
set ELECTRON_WEBPACK_APP_API_URL="http://dev.domain.com/api"
```

##### Reference that variable in our code
```js
import axios from 'axios'

axios.defaults.baseURL = process.env.ELECTRON_WEBPACK_APP_API_URL
```

### `ELECTRON_ARGS`

If you need to provide arguments to the `electron` process itself during development, you can do so using the `ELECTRON_ARGS` environment variable. 


##### From the CLI

When specifying `ELECTRON_ARGS` from the CLI, please note that it will be parsed as a JSON string of an array of values. Thus, you will have to wrap the value in square brackets, and on unix systems escape characters like double quotes. 
For example, if in package.json you have a script `"dev": "electron-webpack dev"`, you can invoke it with the `--inspect-brk` argument like this:

```
# linux and darwin systems, git bash on windows
ELECTRON_ARGS=[\"--inspect-brk=9229\"] yarn dev

# win32 systems, cmd
set ELECTRON_ARGS=["--inspect-brk=9229"]&&yarn dev
```

##### From an `.env` file

Since `electron-webpack` uses the [dotenv](https://www.npmjs.com/package/dotenv) library under the hood, instead of wrestling with CLI arguments, escaping and differences between Windows and Unix systems, you can instead create an `.env` file and specify environment variables:
 
```bash tab=".env.development"
ELECTRON_ARGS=["--inspect-brk=9229"]
```

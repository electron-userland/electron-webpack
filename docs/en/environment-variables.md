# Environment Variables

Sometimes you need your `webpack` build to be dependent upon specific environment variables. Whether you need to set a global API Url or even the application name, here's how you can set variables that `electron-webpack` will provide for your applicaiton.

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

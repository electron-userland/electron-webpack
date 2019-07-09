When using `webpack` to bundle all of our assets together we lose the ability to provide a full path to our assets. This is especially important when we need to use modules like `fs` or those that require a file path to an asset. `electron-webpack` is aware of that issue and provides a solution.

You may have noticed in [Project Structure](./project-structure.md) there is a directory specifically for static assets (`static/`). It is here where we can put assets we explicity don't want `webpack` to bundle. So now how can we access their path?

### Using the `__static` variable

Similar to how `__dirname` can provide you with a path to the parent directory name when working in a Node.js environment, `__static` is made available to provide you a path to your `static/` folder. This variable is available in both `development` and `production`.

#### Use Case

Let's say we have a static Text file (`foobar.txt`) we need to read into our application using `fs`. Here's how we can use the `__static` variable to get a reliable path to our asset.

```txt tab="static/foobar.txt"
foobarbizzbuzz
```

##### someScript.js (`main` or `renderer` process)
```js
import fs from 'fs'
import path from 'path'

/* use `path` to create the full path to our asset */
const pathToAsset = path.join(__static, '/foobar.txt')

/* use `fs` to consume the path and read our asset */
const fileContents = fs.readFileSync(pathToAsset, 'utf8')

console.log(fileContents)
// => "foobarbizzbuzz"
```

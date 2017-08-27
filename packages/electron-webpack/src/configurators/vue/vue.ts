import * as path from "path"
import { WebpackConfigurator } from "../../main"

export function configureVue(configurator: WebpackConfigurator) {
  if (!configurator.hasDependency("vue")) {
    return
  }

  configurator.extensions.push(".vue")

  Object.assign(configurator.config.resolve!!.alias, {
    vue$: "vue/dist/vue.esm.js",
    "vue-router$": "vue-router/dist/vue-router.esm.js",
  })

  if (!configurator.isProduction && configurator.type === "main") {
    configurator.entryFiles.push(path.join(__dirname, "vue-main-dev-entry.js"))
  }

  if (!configurator.type.startsWith("renderer")) {
    return
  }

  configurator.entryFiles.push(path.join(__dirname, "../../../vue-renderer-entry.js"))

  configurator.debug("Vue detected")
  configurator.rules.push(
    {
      test: /\.html$/,
      use: "vue-html-loader"
    },
    {
      test: /\.vue$/,
      use: {
        loader: "vue-loader",
        options: {
          extractCSS: configurator.isProduction,
          loaders: {
            sass: "vue-style-loader!css-loader!sass-loader?indentedSyntax=1",
            scss: "vue-style-loader!css-loader!sass-loader",
          }
        }
      }
    },
  )
}
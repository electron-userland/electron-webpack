import { WebpackConfigurator } from "../webpackConfigurator"

export function configureVue(configurator: WebpackConfigurator) {
  if (!configurator.type.startsWith("renderer")) {
    return
  }

  if (!("vue" in configurator.metadata.devDependencies || "vue" in configurator.metadata.dependencies)) {
    return
  }

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
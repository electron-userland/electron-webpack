import * as path from "path"
import { WebpackConfigurator } from "../webpackConfigurator"

export function configureTypescript(configurator: WebpackConfigurator) {
  const metadata = configurator.metadata
  const hasTsChecker = "fork-ts-checker-webpack-plugin" in metadata.devDependencies || "electron-webpack-ts" in metadata.devDependencies
  if (hasTsChecker || "ts-loader" in metadata.devDependencies) {
    configurator.extensions.splice(1, 0, ".ts")

    // no sense to use fork-ts-checker-webpack-plugin for production build
    if (hasTsChecker && !configurator.isProduction && !configurator.isTest) {
      const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")
      configurator.plugins.push(new ForkTsCheckerWebpackPlugin({tsconfig: path.join(configurator.srcDir, "tsconfig.json")}))
    }

    configurator.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "ts-loader",
          options: {
            // use transpileOnly mode to speed-up compilation
            // in the test mode also, because checked during dev or production build
            transpileOnly: configurator.isTest || !configurator.isProduction,
            appendTsSuffixTo: [/\.vue$/],
          }
        },
      ],
    })
  }
}
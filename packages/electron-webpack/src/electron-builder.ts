import { Lazy } from "lazy-val"
import { getElectronWebpackConfiguration } from "./config"

interface Context {
  projectDir: string
  packageMetadata: Lazy<{ [key: string]: any } | null> | null
}

export default async function(context: Context) {
  const electronWebpackConfig = await getElectronWebpackConfiguration(context)
  return {
    extraMetadata: {
      main: "main.js"
    },
    files: [
      {
        from: ".",
        filter: ["package.json"]
      },
      {
        from: `${electronWebpackConfig.commonDistDirectory}/main`
      },
      {
        from: `${electronWebpackConfig.commonDistDirectory}/renderer`
      },
      {
        from: `${electronWebpackConfig.commonDistDirectory}/renderer-dll`
      }
    ],
    extraResources: [
      {
        from: "static",
        to: "static"
      }
    ]
  }
}

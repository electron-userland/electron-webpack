import { Lazy } from "lazy-val"
import { getElectronWebpackConfiguration } from "./config"

interface Context {
  projectDir: string
  packageMetadata: Lazy<{ [key: string]: any } | null> | null
}

export default async function(context: Context) {
  const electronWebpackConfig = await getElectronWebpackConfiguration(context)
  const distDir = electronWebpackConfig.commonDistDirectory!!
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
        from: `${distDir}/main`
      },
      {
        from: `${distDir}/renderer`
      },
      {
        from: `${distDir}/renderer-dll`
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

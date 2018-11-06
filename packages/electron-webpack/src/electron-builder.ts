import { getElectronWebpackConfig } from "./config"

export default async function() {
  const electronWebpackConfig = await getElectronWebpackConfig()
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
        from: electronWebpackConfig.commonDistDirectory + "/main"
      },
      {
        from: electronWebpackConfig.commonDistDirectory + "/renderer"
      },
      {
        from: electronWebpackConfig.commonDistDirectory + "/renderer-dll"
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

import { writeFile, writeJson } from "fs-extra-p"
import * as path from "path"
import { assertThat, getMutableProjectDir, testWebpack } from "./helpers/helper"

test("nunjucks", async () => {
  const projectDir = await getMutableProjectDir()
  await writeJson(path.join(projectDir, "package.json"), {
    name: "Test",
    devDependencies: {
      "nunjucks-loader": "*"
    }
  })
  await writeFile(path.join(projectDir, "src/main/page.njk"), "myGlobal = {{ myGlobal }}")
  await writeFile(path.join(projectDir, "src/main/index.js"), 'import "./page.njk"')
  const configuration = await require("electron-webpack/webpack.main.config.js")({production: true, configuration: {
    projectDir,
  }})

  return await assertThat(testWebpack(configuration, projectDir)).throws(projectDir)
})
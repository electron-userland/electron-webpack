import { writeFile, writeJson } from "fs-extra"
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

test("sass", async () => {
  const projectDir = await getMutableProjectDir()
  await writeFile(path.join(projectDir, "src/renderer/file.scss"), `
  $font-stack:    Helvetica, sans-serif;
  $primary-color: #333;
  
  body {
    font: 100% $font-stack;
    color: $primary-color;
  }`)
  await writeFile(path.join(projectDir, "src/renderer/index.js"), 'import "./file.scss"')
  const configuration = await require("electron-webpack/webpack.renderer.config.js")({production: true, configuration: {
    projectDir,
  }})

  return await assertThat(testWebpack(configuration, projectDir)).throws(projectDir)
})

test("react", async () => {
  const projectDir = await getMutableProjectDir()
  await writeJson(path.join(projectDir, "package.json"), {
    name: "Test",
    devDependencies: {
      "@babel/preset-react": "*"
    }
  })
  await writeFile(path.join(projectDir, "src/renderer/file.jsx"), `
<MyButton color="blue" shadowSize={2}>
  Click Me
</MyButton>
  `)
  await writeFile(path.join(projectDir, "src/renderer/index.js"), 'import "./file.jsx"')
  const configuration = require("electron-webpack/webpack.renderer.config.js")({production: true, configuration: {
    projectDir,
  }})
  await assertThat(configuration).throws(projectDir)
})

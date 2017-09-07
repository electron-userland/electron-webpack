import * as path from "path"
import { bufferToString, rootDir, testWebpack } from "./helpers/helper"

test("title true", () => testTitle(true))
test("title false", () => testTitle(false))
test("title null", () => testTitle(null))

const rendererConfig = require("electron-webpack/webpack.renderer.config")

async function testTitle(title: boolean | null) {
  const projectDir = path.join(rootDir, "test/fixtures/simple")
  const configuration = await rendererConfig({
    production: true,
    minify: false,
    configuration: {
      projectDir,
      title
    },
  })
  const fs = await testWebpack(configuration, projectDir, false)
  expect(bufferToString(fs.meta(`${projectDir}/dist/renderer/index.html`)).toString()).toMatchSnapshot()
}
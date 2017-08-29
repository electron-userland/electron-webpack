import BluebirdPromise from "bluebird-lst"
import { randomBytes } from "crypto"
import { mkdir, move, outputJson, writeFile } from "fs-extra-p"
import * as path from "path"
import { doTest, getMutableProjectDir, rootDir, testWebpack, tmpDir } from "./helpers/helper"

afterEach(() => tmpDir.cleanup())

test("app", () => doTest("webpack.app.config.js"))

test("main production", () => doTest("webpack.main.config.js"))

test("renderer custom sourceDirectory", async () => {
  const projectDir = await getMutableProjectDir()
  await move(path.join(projectDir, "src/renderer"), path.join(projectDir, "customRenderer"))
  const configuration = await require("electron-webpack/webpack.renderer.config.js")({production: true, configuration: {
    projectDir,
    renderer: {
      sourceDirectory: "customRenderer"
    },
  }})
  await testWebpack(configuration, projectDir)
})

test("main extra entry point and custom source dir", async () => {
  const projectDir = await getMutableProjectDir()
  await move(path.join(projectDir, "src/main"), path.join(projectDir, "customMain"))
  const configuration = await require("electron-webpack/webpack.main.config.js")({production: true, configuration: {
    projectDir,
    main: {
      extraEntries: ["@/foo.js"],
      sourceDirectory: "customMain"
    },
  }})
  await testWebpack(configuration, projectDir)
})

test("renderer production", async () => {
  const projectDir = await getMutableProjectDir()

  function createTestAsset(dirName: string) {
    const dir = path.join(projectDir, dirName)
    return mkdir(dir).then(() => writeFile(path.join(dir, "foo.png"), randomBytes(100 * 1024)))
  }

  // size of file must be greater than url-loader limit
  await BluebirdPromise.all([
    createTestAsset("a"),
    createTestAsset("b"),
  ])

  const configuration = await require("electron-webpack/webpack.renderer.config.js")({configuration: {projectDir}, production: true})
  await testWebpack(configuration, projectDir)
})

test("typescript", async () => {
  const projectDir = await getMutableProjectDir("typescript")
  // noinspection ReservedWordAsName
  await outputJson(path.join(projectDir, "tsconfig.json"), {
    extends: rootDir.replace(/\\/g, "/") + "/packages/electron-webpack/tsconfig-base.json",
    compilerOptions: {
      baseUrl: "src",
    },
  })
  const configuration = await require("electron-webpack/webpack.main.config.js")({production: true, configuration: {
    projectDir,
  }})
  await testWebpack(configuration, projectDir)
})
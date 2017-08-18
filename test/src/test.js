import webpack from "webpack"
import * as path from "path"
import { TmpDir } from "temp-file"
import { copy, mkdir, move, writeFile } from "fs-extra-p"
import { randomBytes } from "crypto"

const MemoryFS = require("memory-fs")

const tmpDir = new TmpDir()

afterEach(() => tmpDir.cleanup())

async function doTest(configurationFile, electronWebpackConfuguration) {
  const projectDir = await getMutableProjectDir()
  const finalConfiguration = Object.assign({projectDir}, electronWebpackConfuguration)
  const configuration = await require(`electron-webpack/${configurationFile}`).default({configuration: finalConfiguration, production: true})
  await testWebpack(configuration, projectDir)
}

test("app", () => doTest("webpack.app.config.js"))

test("main production", () => doTest("webpack.main.config.js"))

test("renderer custom sourceDirectory", async () => {
  const projectDir = await getMutableProjectDir()
  await move(path.join(projectDir, "src/renderer"), path.join(projectDir, "customRenderer"))
  const configuration = await require("electron-webpack/webpack.renderer.config.js").default({production: true, configuration: {
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
  const configuration = await require("electron-webpack/webpack.main.config.js").default({production: true, configuration: {
    projectDir,
    main: {
      extraEntries: ["@/foo.js"],
      sourceDirectory: "customMain"
    },
  }})
  await testWebpack(configuration, projectDir)
})

async function getMutableProjectDir() {
  const projectDir = await tmpDir.getTempDir()
  await copy(path.join(__dirname, "../fixtures"), projectDir)
  return projectDir
}

test("renderer production", async () => {
  const projectDir = await getMutableProjectDir()

  function createTestAsset(dirName) {
    const dir = path.join(projectDir, dirName)
    return mkdir(dir).then(() => writeFile(path.join(dir, "foo.png"), randomBytes(100 * 1024)))
  }

  // size of file must be greater than url-loader limit
  await Promise.all([
    createTestAsset("a"),
    createTestAsset("b"),
  ])

  const configuration = await require("electron-webpack/webpack.renderer.config.js").default({configuration: {projectDir}, production: true})
  await testWebpack(configuration, projectDir)
})

function addCustomResolver(configuration) {
  expect(configuration.resolveLoader).toBeUndefined()
  configuration.resolveLoader = {}
  configuration.resolveLoader.modules = [path.join(__dirname, "../../node_modules"), path.join(__dirname, "../../packages/electron-webpack/node_modules")]
}

test("title true", () => testTitle(true))
test("title false", () => testTitle(false))
test("title null", () => testTitle(null))

async function testTitle(title) {
  const projectDir = path.join(__dirname, "../fixtures")
  const configuration = await require("electron-webpack/webpack.renderer.config.js").default({production: true, minify: false, configuration: {
    projectDir, title}})
  const fs = await testWebpack(configuration, projectDir, false)
  expect(bufferToString(fs.meta(projectDir + "/dist/renderer/index.html")).toString()).toMatchSnapshot()
}

async function testWebpack(configuration, projectDir, checkCompilation = true) {
  if (Array.isArray(configuration)) {
    configuration.forEach(addCustomResolver)
  }
  else {
    addCustomResolver(configuration)
  }

  const fs = new MemoryFS()
  const stats = await new Promise((resolve, reject) => {
    compile(fs, configuration, resolve, reject)
  })

  debugger
  if (checkCompilation) {
    expect(statToMatchObject(stats, projectDir)).toMatchSnapshot()
    expect(bufferToString(fs.meta(projectDir))).toMatchSnapshot()
  }
  return fs
}

function statToMatchObject(stats, projectDir) {
  if (stats.hasErrors()) {
    throw new Error(stats.toJson().errors)
  }

  // skip first 3 lines - Hash, Version and Time
  return stats.toString()
    .split(/\r?\n/)
    .filter(it => {
      const trimmed = it.trim()
      return !trimmed.startsWith("Time:") && !trimmed.startsWith("Hash:") && !trimmed.startsWith("Version:")
    })
    .join("\n")
    .replace(new RegExp(projectDir, "g"), "<project-dir>")
}

function compile(fs, configuration, resolve, reject) {
  const compiler = webpack(configuration)
  compiler.outputFileSystem = fs
  compiler.run((error, stats) => {
    if (error != null) {
      reject(error)
      return
    }

    resolve(stats)
  })
}

function bufferToString(host) {
  for (const key of Object.getOwnPropertyNames(host)) {
    if (key === "") {
      delete host[key]
    }

    const value = host[key]
    if (value == null) {
      continue
    }

    if (Buffer.isBuffer(value)) {
      host[key] = value.toString()
    }
    else if (typeof value === "object") {
      bufferToString(value)
    }
  }
  return host
}

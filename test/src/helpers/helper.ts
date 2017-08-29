import BluebirdPromise from "bluebird-lst"
import { ElectronWebpackConfiguration } from "electron-webpack"
import { copy } from "fs-extra-p"
import MemoryFS from "memory-fs"
import * as path from "path"
import { TmpDir } from "temp-file"
import webpack, { Configuration, Stats } from "webpack"

export const tmpDir = new TmpDir()

export const rootDir = path.join(__dirname, "..", "..", "..")

export async function doTest(configurationFile: string, electronWebpackConfiguration?: ElectronWebpackConfiguration) {
  const projectDir = await getMutableProjectDir()
  const finalConfiguration = {projectDir, ...electronWebpackConfiguration}
  const configuration = await require(`electron-webpack/${configurationFile}`)({configuration: finalConfiguration, production: true})
  await testWebpack(configuration, projectDir)
}

export async function getMutableProjectDir(fixtureName = "simple") {
  const projectDir = await tmpDir.getTempDir()
  await copy(path.join(rootDir, "test/fixtures", fixtureName), projectDir)
  return projectDir
}

export async function testWebpack(configuration: Configuration, projectDir: string, checkCompilation = true) {
  if (Array.isArray(configuration)) {
    configuration.forEach(addCustomResolver)
  }
  else {
    addCustomResolver(configuration)
  }

  const fs = new MemoryFS()
  const stats = await new BluebirdPromise<Stats>((resolve, reject) => {
    compile(fs, configuration, resolve, reject)
  })

  if (checkCompilation) {
    expect(statToMatchObject(stats, projectDir)).toMatchSnapshot()
    expect(bufferToString(fs.meta(projectDir))).toMatchSnapshot()
  }
  return fs
}

function addCustomResolver(configuration: Configuration) {
  expect(configuration.resolveLoader).toBeUndefined()
  configuration.resolveLoader = {
    modules: [path.join(rootDir, "node_modules"), path.join(rootDir, "packages/electron-webpack/node_modules")]
  }
}

function statToMatchObject(stats: Stats, projectDir: string) {
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

function compile(fs: any, configuration: Configuration, resolve: (stats: Stats) => void, reject: (error?: Error) => void) {
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

export function bufferToString(host: any) {
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

export function assertThat(actual: any): Assertions {
  return new Assertions(actual)
}

class Assertions {
  constructor(private actual: any) {
  }

  containsAll<T>(expected: Iterable<T>) {
    expect(this.actual.slice().sort()).toEqual(Array.from(expected).slice().sort())
  }

  async throws(projectDir: string) {
    let actualError: Error | null = null
    let result: any
    try {
      result = await this.actual
    }
    catch (e) {
      actualError = e
    }

    let m
    if (actualError == null) {
      m = result
    }
    else {
      m = actualError.message
      m = m.toString()
        .replace(new RegExp(projectDir, "g"), "<project-dir>")
        .replace(new RegExp(rootDir, "g"), "<root-dir>")
    }
    try {
      expect(m).toMatchSnapshot()
    }
    catch (matchError) {
      throw new Error(matchError + " " + actualError)
    }
  }
}
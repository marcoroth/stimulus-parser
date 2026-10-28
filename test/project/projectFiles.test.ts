import os from "os"
import path from "path"
import { execFileSync } from "child_process"
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises"
import { describe, beforeEach, afterEach, test, expect } from "vitest"
import { Project } from "../../src"

const controller = `import { Controller } from "@hotwired/stimulus"\n\nexport default class extends Controller {}\n`

let tempPath: string | undefined
let projectPath: string

const write = async (file: string, content = controller) => {
  const filePath = path.join(projectPath, file)

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content)
}

const projectFilePaths = async () => {
  const project = new Project(projectPath)

  await project.initialize()

  return project.projectFiles.map(file => project.relativePath(file.path)).sort()
}

describe("Project", () => {
  beforeEach(async () => {
    tempPath = await mkdtemp(path.join(os.tmpdir(), "stimulus-parser-"))
    projectPath = tempPath

    await write(".gitignore", "/public/assets\n")
    await write("app/javascript/controllers/hello_controller.js")
    await write("public/assets/application-4f2a.js")
    await write("node_modules/some-package/index.js")
  })

  afterEach(async () => {
    if (tempPath) await rm(tempPath, { recursive: true, force: true })
    tempPath = undefined
  })

  test("skips gitignored files in a git repository", async () => {
    execFileSync("git", ["init", "--quiet"], { cwd: projectPath })
    execFileSync("git", ["add", "app/javascript/controllers/hello_controller.js"], { cwd: projectPath })

    await write("app/javascript/controllers/untracked_controller.js")
    await write("app/javascript/controllers/deleted_controller.js")
    execFileSync("git", ["add", "app/javascript/controllers/deleted_controller.js"], { cwd: projectPath })
    await rm(path.join(projectPath, "app/javascript/controllers/deleted_controller.js"))

    expect(await projectFilePaths()).toEqual([
      "app/javascript/controllers/hello_controller.js",
      "app/javascript/controllers/untracked_controller.js",
    ])
  })

  test("falls back to globbing everything but node_modules outside a git repository", async () => {
    expect(await projectFilePaths()).toEqual([
      "app/javascript/controllers/hello_controller.js",
      "public/assets/application-4f2a.js",
    ])
  })

  test("falls back to globbing when the project sits in an ignored folder of an enclosing git repository", async () => {
    await write(".gitignore", "/nested\n")
    execFileSync("git", ["init", "--quiet"], { cwd: projectPath })

    projectPath = path.join(projectPath, "nested")
    await write("app/javascript/controllers/hello_controller.js")

    expect(await projectFilePaths()).toEqual([
      "app/javascript/controllers/hello_controller.js",
    ])
  })
})

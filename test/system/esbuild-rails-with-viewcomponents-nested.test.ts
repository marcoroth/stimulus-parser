import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("esbuild-rails-with-viewcomponents-nested")

describe("System", () => {
  test("esbuild-rails-with-viewcomponents-nested", async () => {
    expect(project.controllersIndexFiles.length).toEqual(0)
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toEqual("application")
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")

    expect(project.controllersIndexFiles.length).toEqual(2)

    expect(project.controllersIndexFiles[0].applicationImport).toBeDefined()
    expect(project.controllersIndexFiles[0].localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersIndexFiles[0].path)).toEqual("app/components/index.js")

    expect(project.controllersIndexFiles[1].applicationImport).toBeDefined()
    expect(project.controllersIndexFiles[1].localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersIndexFiles[1].path)).toEqual("app/javascript/controllers/index.js")

    expect(project.registeredControllers.length).toEqual(3)

    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode]).sort()).toEqual([
      ["comment--component", "esbuild-rails"],
      ["hello", "esbuild-rails"],
      ["user--message", "esbuild-rails"],
    ])

    expect(Array.from(project.controllerRoots).sort()).toEqual([
      "app/components",
      "app/javascript/controllers",
    ])
  })
})

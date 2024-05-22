import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("esbuild-rails-with-viewcomponents")

describe("System", () => {
  test("esbuild-rails-with-viewcomponents", async () => {
    expect(project.controllersFiles.length).toEqual(0)
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toEqual("application")
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")

    expect(project.controllersFiles.length).toEqual(2)

    expect(project.controllersFiles[0].applicationImport).toBeDefined()
    expect(project.controllersFiles[0].localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersFiles[0].path)).toEqual("app/components/index.js")

    expect(project.controllersFiles[1].applicationImport).toBeDefined()
    expect(project.controllersFiles[1].localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersFiles[1].path)).toEqual("app/javascript/controllers/index.js")

    expect(project.registeredControllers.length).toEqual(3)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([
      ["message", "esbuild-rails"],
      ["comment--component", "esbuild-rails"],
      ["hello", "esbuild-rails"],
    ])
    expect(Array.from(project.controllerRoots).sort()).toEqual([
      "app/components",
      "app/javascript/controllers",
    ])
  })
})

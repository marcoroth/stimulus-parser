import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("esbuild-rails-single-stimulus-file")

describe("System", () => {
  test("esbuild-rails-single-stimulus-file", async () => {
    expect(project.controllersFiles.length).toEqual(0)
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toBeUndefined()
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/index.js")

    expect(project.controllersFiles.length).toEqual(1)
    expect(project.controllersFiles[0].applicationImport).toBeUndefined()
    expect(project.controllersFiles[0].localApplicationConstant).toEqual("Application")
    expect(project.relativePath(project.controllersFiles[0].path)).toEqual("app/javascript/controllers/index.js")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "esbuild-rails"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/javascript/controllers"])
  })
})

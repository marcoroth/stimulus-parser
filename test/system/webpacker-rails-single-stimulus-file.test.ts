import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("webpacker-rails-single-stimulus-file")

describe("System", () => {
  test("webpacker-rails-single-stimulus-file", async () => {
    expect(project.controllersIndexFiles.length).toEqual(0)
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toBeUndefined()
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/index.ts")

    expect(project.controllersIndexFiles.length).toEqual(1)
    expect(project.controllersIndexFiles[0].applicationImport).toBeUndefined()
    expect(project.controllersIndexFiles[0].localApplicationConstant).toEqual("Application")
    expect(project.relativePath(project.controllersIndexFiles[0].path)).toEqual("app/javascript/controllers/index.ts")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-webpack-helpers"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/javascript/controllers"])
  })
})

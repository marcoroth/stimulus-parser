import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("webpacker-rails-single-stimulus-file")

describe("System", () => {
  test("webpacker-rails-single-stimulus-file", async () => {
    expect(project.controllersFile).toBeUndefined()
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toBeUndefined()
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/index.ts")

    expect(project.controllersFile).toBeDefined()
    expect(project.controllersFile.applicationImport).toBeUndefined()
    expect(project.controllersFile.localApplicationConstant).toEqual("Application")
    expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.ts")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-webpack-helpers"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/javascript/controllers"])
  })
})

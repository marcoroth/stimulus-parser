import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("vite-laravel")

describe("System", () => {
  test("vite-laravel", async () => {
    expect(project.controllersFile).toBeUndefined()
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("Stimulus")
    expect(project.applicationFile.exportedApplicationConstant).toEqual("Stimulus")
    expect(project.relativePath(project.applicationFile.path)).toEqual("resources/js/libs/stimulus.js")

    expect(project.controllersFile).toBeDefined()
    expect(project.controllersFile.applicationImport).toBeDefined()
    expect(project.controllersFile.localApplicationConstant).toEqual("Stimulus")
    expect(project.relativePath(project.controllersFile.path)).toEqual("resources/js/controllers/index.js")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "register"]])
    expect(Array.from(project.controllerRoots)).toEqual(["resources/js/controllers"])
  })
})

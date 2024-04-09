import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("webpacker")

describe("System", () => {
  test("webpacker", async () => {
    expect(project.controllersFile).toBeUndefined()
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.controllersFile).toBeDefined()
    expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")

    expect(project.applicationFile).toBeDefined()
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-webpack-helpers"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/javascript/controllers"])
  })
})

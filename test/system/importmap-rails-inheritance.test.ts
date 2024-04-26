import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("importmap-rails-inheritance")

describe("System", () => {
  test("importmap-rails-inheritance", async () => {
    expect(project.controllersFile).toBeUndefined()
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toEqual("application")
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")

    expect(project.controllersFile).toBeDefined()
    expect(project.controllersFile.applicationImport).toBeDefined()
    expect(project.controllersFile.localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")

    expect(project.registeredControllers.length).toEqual(2)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["application", "stimulus-loading-eager"], ["hello", "stimulus-loading-eager"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/javascript/controllers"])
  })
})

import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("multiple-applications")

describe("System", () => {
  test("multiple-applications", async () => {
    expect(project.controllersFiles.length).toEqual(0)
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toEqual("application")
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/backend/application.js")

    expect(project.controllersFiles.length).toEqual(1)
    expect(project.controllersFiles[0].applicationImport).toBeDefined()
    expect(project.controllersFiles[0].localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersFiles[0].path)).toEqual("app/javascript/controllers/backend/index.js")

    expect(project.controllerRoots.length).toEqual(2)
    expect(project.controllerRoots[0]).toEqual("app/javascript/controllers/application")
    expect(project.controllerRoots[1]).toEqual("app/javascript/controllers/backend")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "register"]])
    expect(Array.from(project.controllerRoots).sort()).toEqual([
      "app/javascript/controllers/application",
      "app/javascript/controllers/backend"
    ])
  })
})

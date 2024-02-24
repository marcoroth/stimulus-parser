import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("esbuild-rails")

describe("System", () => {
  test("esbuild-rails", async () => {
    expect(project.controllersFile).toBeUndefined()
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.controllersFile).toBeDefined()
    expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")

    expect(project.applicationFile).toBeDefined()
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "esbuild-rails"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/javascript/controllers"])
  })
})

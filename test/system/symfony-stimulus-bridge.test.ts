import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("symfony-stimulus-bridge")

describe("System", () => {
  test("symfony-stimulus-bridge", async () => {
    expect(project.controllersIndexFiles.length).toEqual(0)
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeUndefined()
    expect(project.controllersIndexFiles.length).toBeGreaterThanOrEqual(1)

    const bootstrapFile = project.controllersIndexFiles.find((f) =>
      f.path.endsWith("bootstrap.js"),
    )
    expect(bootstrapFile).toBeDefined()
    expect(bootstrapFile?.applicationImport).toBeUndefined()

    expect(project.registeredControllers.length).toEqual(1)
    expect(
      project.registeredControllers.map((controller) => [
        controller.identifier,
        controller.loadMode,
      ]),
    ).toEqual([["hello", "stimulus-loading-lazy"]])
    expect(Array.from(project.controllerRoots).sort()).toContain(
      "assets/controllers",
    )
  })
})

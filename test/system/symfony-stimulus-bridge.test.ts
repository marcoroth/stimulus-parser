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

  test("symfony-asset-mapper", async () => {
    const assetMapperProject = setupProject("symfony-asset-mapper")

    expect(assetMapperProject.controllersIndexFiles.length).toEqual(0)
    expect(assetMapperProject.applicationFile).toBeUndefined()
    expect(assetMapperProject.registeredControllers.length).toEqual(0)

    await assetMapperProject.initialize()

    expect(assetMapperProject.applicationFile).toBeUndefined()
    expect(assetMapperProject.controllersIndexFiles.length).toBeGreaterThanOrEqual(1)

    const bootstrapFile = assetMapperProject.controllersIndexFiles.find((f) =>
      f.path.endsWith("bootstrap.js"),
    )
    expect(bootstrapFile).toBeDefined()
    expect(bootstrapFile?.applicationImport).toBeUndefined()

    expect(assetMapperProject.registeredControllers.length).toEqual(1)
    expect(
      assetMapperProject.registeredControllers.map((controller) => [
        controller.identifier,
        controller.loadMode,
      ]),
    ).toEqual([["hello", "stimulus-loading-lazy"]])
    expect(Array.from(assetMapperProject.controllerRoots).sort()).toContain(
      "assets/controllers",
    )
  })
})

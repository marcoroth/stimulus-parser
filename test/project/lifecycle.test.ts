import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

let project = setupProject("app")

describe("Project", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  test("has no files by default", () => {
    expect(project.projectFiles.length).toEqual(0)
    expect(project.controllerDefinitions.length).toEqual(0)
  })

  test("picks up files on initially", async () => {
    expect(project.projectFiles.length).toEqual(0)
    expect(project.controllerDefinitions.length).toEqual(0)

    await project.initialize()

    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)
  })

  test("doesn't re-add files when calling initialize() more than once", async () => {
    expect(project.projectFiles.length).toEqual(0)
    expect(project.controllerDefinitions.length).toEqual(0)

    await project.initialize()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)

    await project.initialize()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)

    await project.initialize()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)
  })

  test("doesn't re-add files when calling initialize() once and refresh() more than once", async () => {
    expect(project.projectFiles.length).toEqual(0)
    expect(project.controllerDefinitions.length).toEqual(0)
    expect(project.registeredControllers).toHaveLength(0)

    await project.initialize()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)
    expect(project.registeredControllers).toHaveLength(2)

    await project.refresh()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)
    expect(project.registeredControllers).toHaveLength(2)

    await project.refresh()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)
    expect(project.registeredControllers).toHaveLength(2)

    await project.refresh()
    expect(project.projectFiles).toHaveLength(4)
    expect(project.controllerDefinitions).toHaveLength(2)
    expect(project.registeredControllers).toHaveLength(2)
  })
})

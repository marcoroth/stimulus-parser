import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"

import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject("empty")

describe("exported controller definitions", () => {
  beforeEach(() => {
    project = setupProject("empty")
  })

  test("only exports exported controllers", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class Parent extends Controller {}
      export default class extends Parent {}
    `


    const sourceFile = new SourceFile(project, "export_controller.js", code)
    project.projectFiles.push(sourceFile)

    await project.initialize()

    expect(sourceFile.controllerDefinitions).toHaveLength(2)

    const parent = sourceFile.controllerDefinitions[0]
    const child = sourceFile.controllerDefinitions[1]

    expect(parent).toBeDefined()
    expect(child).toBeDefined()

    expect(project.registeredControllers).toHaveLength(0)
    expect(project.controllerDefinitions).toHaveLength(1)
    expect(project.allControllerDefinitions).toHaveLength(2)
    expect(project.allProjectControllerDefinitions).toHaveLength(2)

    expect(project.controllerDefinitions).not.toContain(parent)
    expect(project.controllerDefinitions).toContain(child)

    expect(project.allControllerDefinitions).toContain(parent)
    expect(project.allControllerDefinitions).toContain(child)

    expect(project.allProjectControllerDefinitions).toContain(parent)
    expect(project.allProjectControllerDefinitions).toContain(child)
  })
})

import { describe, beforeEach, test, expect } from "vitest"
import { NodeModule } from "../src"
import { setupProject } from "./helpers/setup"

let project = setupProject("packages/tailwindcss-stimulus-components")

describe("NodeModule", () => {
  beforeEach(() => {
    project = setupProject("packages/tailwindcss-stimulus-components")
  })

  test("entrypointSourceFile", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    expect(project.relativePath(nodeModule.entrypointSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
  })

  test("classDeclarations", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.classDeclarations).toHaveLength(9)
  })

  test("controllerDefinitions", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.controllerDefinitions).toHaveLength(8)
  })

  test("allows to be refreshed", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.classDeclarations).toHaveLength(9)
    expect(nodeModule.controllerDefinitions).toHaveLength(8)

    await nodeModule.refresh()

    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.classDeclarations).toHaveLength(9)
    expect(nodeModule.controllerDefinitions).toHaveLength(8)
  })
})

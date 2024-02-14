import { describe, test, expect } from "vitest"
import { Project, NodeModule } from "../src"

const project = new Project(`${process.cwd()}/test/fixtures/packages/tailwindcss-stimulus-components`)

describe("NodeModule", () => {
  test("entrypointSourceFile", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    expect(project.relativePath(nodeModule.entrypointSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
  })

  test("classDeclarations", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    await nodeModule.analyze()

    expect(nodeModule.classDeclarations).toHaveLength(9)
  })

  test("controllerDefinitions", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    await nodeModule.analyze()

    expect(nodeModule.controllerDefinitions).toHaveLength(8)
  })
})

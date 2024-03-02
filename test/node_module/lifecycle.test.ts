import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"
import { NodeModule } from "../../src/node_module"

let project = setupProject("app")

describe("Node Module", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  test("analyze", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")
    expect(nodeModule.isAnalyzed).toEqual(false)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(0)

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(11)
  })

  test("initialize more than once", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")
    expect(nodeModule.isAnalyzed).toEqual(false)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(0)

    await nodeModule.initialize()
    await nodeModule.analyze()

    await nodeModule.initialize()
    await nodeModule.analyze()

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(11)
  })

  test("refreshes", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    expect(nodeModule.isAnalyzed).toEqual(false)
    expect(project.relativePath(nodeModule.entrypointSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(0)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(0)

    await nodeModule.initialize()
    await nodeModule.analyze()
    await nodeModule.refresh()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(9)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(11)

    await nodeModule.refresh()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(9)
    expect(nodeModule.sourceFiles).toHaveLength(11)
    expect(nodeModule.sourceFiles.filter(file => file.isAnalyzed)).toHaveLength(11)
  })

  test("entrypoint file exports", async () => {
    const nodeModule = await NodeModule.forProject(project, "tailwindcss-stimulus-components")

    expect(nodeModule.isAnalyzed).toEqual(false)
    expect(project.relativePath(nodeModule.entrypointSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(0)

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(9)

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(9)

    await nodeModule.initialize()
    await nodeModule.analyze()

    expect(nodeModule.isAnalyzed).toEqual(true)
    expect(nodeModule.entrypointSourceFile.importDeclarations).toHaveLength(0)
    expect(nodeModule.entrypointSourceFile.exportDeclarations).toHaveLength(9)
  })
})

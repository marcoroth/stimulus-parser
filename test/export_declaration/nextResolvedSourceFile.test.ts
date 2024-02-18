import dedent from "dedent"
import path from "path"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"

let project = new Project(process.cwd())

describe("ExportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("nextResolvedSourceFile", () => {
    test("resolve relative import to file", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        export { ParentController } from "./parent_controller"
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "src/parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedSourceFile).toBeDefined()
      expect(exportDeclaration.nextResolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(exportDeclaration.nextResolvedSourceFile).toEqual(parentFile)
      expect(project.relativePath(exportDeclaration.nextResolvedSourceFile.path)).toEqual("src/parent_controller.js")
    })

    test("resolve SourceFile to node module entry point", async () => {
      const childCode = dedent`
        export { Modal } from "tailwindcss-stimulus-components"
      `

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      const exportDeclaration = childFile.exportDeclarations[0]
      const nodeModule = exportDeclaration.resolvedNodeModule

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedSourceFile).toBeDefined()
      expect(exportDeclaration.nextResolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(exportDeclaration.nextResolvedSourceFile).toEqual(nodeModule.entrypointSourceFile)
      expect(project.relativePath(exportDeclaration.nextResolvedSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
    })
  })
})

import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { createTestSourceFile } from "../helpers/temp"
import { setupProject } from "../helpers/setup"

let project = setupProject("app", { writable: true })

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = setupProject("app", { writable: true })
  })

  describe("nextResolvedSourceFile", () => {
    test("resolve relative import to file", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const parentFile = createTestSourceFile(project, "src/parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedSourceFile).toBeDefined()
      expect(importDeclaration.nextResolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(importDeclaration.nextResolvedSourceFile).toEqual(parentFile)
      expect(project.relativePath(importDeclaration.nextResolvedSourceFile.path)).toEqual("src/parent_controller.js")
    })

    test("resolve SourceFile to node module entry point", async () => {
      const childCode = dedent`
        import { Modal } from "tailwindcss-stimulus-components"
      `

      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      const importDeclaration = childFile.importDeclarations[0]
      const nodeModule = importDeclaration.resolvedNodeModule

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedSourceFile).toBeDefined()
      expect(importDeclaration.nextResolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(importDeclaration.nextResolvedSourceFile).toEqual(nodeModule.entrypointSourceFile)
      expect(project.relativePath(importDeclaration.nextResolvedSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
    })
  })
})

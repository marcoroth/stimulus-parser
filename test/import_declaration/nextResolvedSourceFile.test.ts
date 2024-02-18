import dedent from "dedent"
import path from "path"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"

let project = new Project(process.cwd())

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("nextResolvedSourceFile", () => {
    test("resolve relative import to file", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "src/parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)

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

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)
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

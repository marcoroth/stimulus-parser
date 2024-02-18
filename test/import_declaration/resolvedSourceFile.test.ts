import dedent from "dedent"
import path from "path"
import { describe, beforeEach, test, expect } from "vitest"
import { Project, SourceFile } from "../../src"

let project = new Project(process.cwd())

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("resolvedSourceFile", () => {
    test("resolve relative import to file", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `
      const parentCode = dedent`
        export { GrandparentController } from "./grandparent_controller"
      `
      const childCode = dedent`
        import { GrandparentController } from "./parent_controller"
      `

      const grandparentFile = new SourceFile(project, path.join(project.projectPath, "src/grandparent_controller.js"), grandparentCode)
      const parentFile = new SourceFile(project, path.join(project.projectPath, "src/parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)

      project.projectFiles.push(grandparentFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedSourceFile).toBeDefined()
      expect(importDeclaration.resolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(importDeclaration.resolvedSourceFile).toEqual(grandparentFile)
      expect(project.relativePath(importDeclaration.resolvedSourceFile.path)).toEqual("src/grandparent_controller.js")
    })

    test("resolve SourceFile to node module entry point", async () => {
      const childCode = dedent`
        import { Modal } from "tailwindcss-stimulus-components"
      `

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedSourceFile).toBeDefined()
      expect(importDeclaration.resolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(project.relativePath(importDeclaration.resolvedSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
    })
  })
})

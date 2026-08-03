import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { createTestSourceFile } from "../helpers/temp"
import { setupProject } from "../helpers/setup"

let project = setupProject("app", { writable: true })

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = setupProject("app", { writable: true })
  })

  describe("resolvedPath", () => {
    test("doesn't resolve relative path if file doesn't exist", async () => {
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedPath).toBeUndefined()
    })

    test("resolve relative path to other file", async () => {
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

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.resolvedPath)).toEqual("src/parent_controller.js")
    })

    test("doens't resolve relative path to other file up a directory if file doesn't exist", async () => {
      const childCode = dedent`
        import { ParentController } from "../parent_controller"
      `

      const childFile = createTestSourceFile(project, "src/controllers/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedPath).toBeUndefined()
    })

    test("resolve relative path to other file up a directory", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        import { ParentController } from "../parent_controller"
      `

      const parentFile = createTestSourceFile(project, "src/parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "src/controllers/child_controller.js", childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.resolvedPath)).toEqual("src/parent_controller.js")
    })

    test("resolve relative path through multiple files", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `

      const parentCode = dedent`
        export { GrandparentController } from "./grandparent_controller"
      `

      const childCode = dedent`
        import { GrandparentController } from "./parent_controller"
      `

      const grandparentFile = createTestSourceFile(project, "src/grandparent_controller.js", grandparentCode)
      const parentFile = createTestSourceFile(project, "src/parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)

      project.projectFiles.push(grandparentFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.resolvedPath)).toEqual("src/grandparent_controller.js")
    })

    test("resolve path to node module entry point", async () => {
      const childCode = dedent`
        import { Modal } from "tailwindcss-stimulus-components"
      `

      const childFile = createTestSourceFile(project, "src/controllers/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.resolvedPath)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
    })
  })
})

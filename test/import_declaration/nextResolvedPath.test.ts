import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { createTestSourceFile } from "../helpers/temp"
import { setupProject } from "../helpers/setup"

let project = setupProject("app", { writable: true })

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = setupProject("app", { writable: true })
  })

  describe("nextResolvedPath", () => {
    test("resolve relative path to other file", async () => {
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.nextResolvedPath)).toEqual("src/parent_controller.js")
    })

    test("resolve relative path to other file up a directory", async () => {
      const childCode = dedent`
        import { ParentController } from "../parent_controller"
      `

      const childFile = createTestSourceFile(project, "src/controllers/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.importDeclarations.length).toEqual(1)
      const importDeclaration = childFile.importDeclarations[0]

      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.nextResolvedPath)).toEqual("src/parent_controller.js")
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
      expect(importDeclaration.nextResolvedPath).toBeDefined()
      expect(project.relativePath(importDeclaration.nextResolvedPath)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
    })
  })
})

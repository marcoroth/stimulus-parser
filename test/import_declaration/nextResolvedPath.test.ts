import dedent from "dedent"
import path from "path"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("nextResolvedPath", () => {
    test("resolve relative path to other file", async () => {
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)
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

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/controllers/child_controller.js"), childCode)
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

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/controllers/child_controller.js"), childCode)
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

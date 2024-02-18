import dedent from "dedent"
import path from "path"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ExportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("nextResolvedPath", () => {
    test("resolve relative path to other file", async () => {
      const childCode = dedent`
        export { ParentController } from "./parent_controller"
      `

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/child_controller.js"), childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.exportDeclarations.length).toEqual(1)
      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedPath).toBeDefined()
      expect(project.relativePath(exportDeclaration.nextResolvedPath)).toEqual("src/parent_controller.js")
    })

    test("resolve relative path to other file up a directory", async () => {
      const childCode = dedent`
        export { ParentController } from "../parent_controller"
      `

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/controllers/child_controller.js"), childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.exportDeclarations.length).toEqual(1)
      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedPath).toBeDefined()
      expect(project.relativePath(exportDeclaration.nextResolvedPath)).toEqual("src/parent_controller.js")
    })

    test("resolve path to node module entry point", async () => {
      const childCode = dedent`
        export { Modal } from "tailwindcss-stimulus-components"
      `

      const childFile = new SourceFile(project, path.join(project.projectPath, "src/controllers/child_controller.js"), childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(childFile.exportDeclarations.length).toEqual(1)
      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedPath).toBeDefined()
      expect(project.relativePath(exportDeclaration.nextResolvedPath)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")
    })
  })
})

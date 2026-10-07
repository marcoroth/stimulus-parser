import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { createTestSourceFile } from "../helpers/temp"
import { setupProject } from "../helpers/setup"

let project = setupProject("app", { writable: true })

describe("ExportDeclaration", () => {
  beforeEach(() => {
    project = setupProject("app", { writable: true })
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
        export { GrandparentController } from "./parent_controller"
      `

      const grandparentFile = createTestSourceFile(project, "src/grandparent_controller.js", grandparentCode)
      const parentFile = createTestSourceFile(project, "src/parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)

      project.projectFiles.push(grandparentFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.resolvedSourceFile).toBeDefined()
      expect(exportDeclaration.resolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(exportDeclaration.resolvedSourceFile).toEqual(grandparentFile)
      expect(project.relativePath(exportDeclaration.resolvedSourceFile.path)).toEqual("src/grandparent_controller.js")
    })

    test("resolve SourceFile to node module", async () => {
      const childCode = dedent`
        export { Modal } from "tailwindcss-stimulus-components"
      `

      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.resolvedSourceFile).toBeDefined()
      expect(exportDeclaration.resolvedSourceFile).toBeInstanceOf(SourceFile)
      expect(project.relativePath(exportDeclaration.resolvedSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
    })

    test("doesn't resolve SourceFile to node module if export doesn't exist", async () => {
      const childCode = dedent`
        export { SomethingElse } from "tailwindcss-stimulus-components"
      `

      const childFile = createTestSourceFile(project, "src/child_controller.js", childCode)
      project.projectFiles.push(childFile)

      await project.analyze()

      const exportDeclaration = childFile.exportDeclarations[0]

      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.resolvedSourceFile).toBeUndefined()
    })
  })
})

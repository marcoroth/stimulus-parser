import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { ClassDeclaration } from "../../src"
import { createTestSourceFile } from "../helpers/temp"
import { setupProject } from "../helpers/setup"

let project = setupProject("app", { writable: true })

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = setupProject("app", { writable: true })
  })

  describe("resolvedClassDeclaration", () => {
    test("resolve named import class defined in other file", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const parentFile = createTestSourceFile(project, "parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "child_controller.js", childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.importDeclarations.length).toEqual(1)

      const importDeclaration = childFile.importDeclarations[0]
      const parent = parentFile.findClass("ParentController")

      expect(parent).toBeDefined()
      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.resolvedClassDeclaration.className).toEqual("ParentController")
      expect(importDeclaration.resolvedClassDeclaration).toEqual(parent)
    })

    test("resolve default import class defined in other file", async () => {
      const parentCode = dedent`
        export default class ParentController {}
      `
      const childCode = dedent`
        import ParentController from "./parent_controller"
      `

      const parentFile = createTestSourceFile(project, "parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "child_controller.js", childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.importDeclarations.length).toEqual(1)

      const importDeclaration = childFile.importDeclarations[0]
      const parent = parentFile.findClass("ParentController")

      expect(parent).toBeDefined()
      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.resolvedClassDeclaration.className).toEqual("ParentController")
      expect(importDeclaration.resolvedClassDeclaration).toEqual(parent)
    })

    test("resolve re-export named", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `

      const parentCode = dedent`
        export { GrandparentController } from "./grandparent_controller"
      `

      const childCode = dedent`
        import { GrandparentController } from "./parent_controller"
      `

      const grandparentFile = createTestSourceFile(project, "grandparent_controller.js", grandparentCode)
      const parentFile = createTestSourceFile(project, "parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "child_controller.js", childCode)

      project.projectFiles.push(grandparentFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(grandparentFile.classDeclarations.length).toEqual(1)
      expect(grandparentFile.exportDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.importDeclarations.length).toEqual(1)

      const importDeclaration = childFile.importDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.resolvedClassDeclaration).toEqual(grandparent)
    })

    test("resolve re-export default as default", async () => {
      const grandparentCode = dedent`
        export default class GrandparentController {}
      `

      const parentCode = dedent`
        export { default } from "./grandparent_controller"
      `

      const childCode = dedent`
        import ParentController from "./parent_controller"
      `

      const grandparentFile = createTestSourceFile(project, "grandparent_controller.js", grandparentCode)
      const parentFile = createTestSourceFile(project, "parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "child_controller.js", childCode)

      project.projectFiles.push(grandparentFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(grandparentFile.classDeclarations.length).toEqual(1)
      expect(grandparentFile.exportDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.importDeclarations.length).toEqual(1)

      const importDeclaration = childFile.importDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.resolvedClassDeclaration).toEqual(grandparent)
    })

    test("resolve re-export from default to named", async () => {
      const grandparentCode = dedent`
        export default class GrandparentController {}
      `

      const parentCode = dedent`
        export { default as RenamedController } from "./grandparent_controller"
      `

      const childCode = dedent`
        import { RenamedController } from "./parent_controller"
      `

      const grandparentFile = createTestSourceFile(project, "grandparent_controller.js", grandparentCode)
      const parentFile = createTestSourceFile(project, "parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "child_controller.js", childCode)

      project.projectFiles.push(childFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(grandparentFile)

      await project.analyze()

      expect(grandparentFile.classDeclarations.length).toEqual(1)
      expect(grandparentFile.exportDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.importDeclarations.length).toEqual(1)

      const importDeclaration = childFile.importDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.resolvedClassDeclaration).toEqual(grandparent)
    })

    test("resolve re-export from named to default", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `

      const parentCode = dedent`
        export { GrandparentController as default } from "./grandparent_controller"
      `

      const childCode = dedent`
        import RenamedController from "./parent_controller"
      `

      const grandparentFile = createTestSourceFile(project, "grandparent_controller.js", grandparentCode)
      const parentFile = createTestSourceFile(project, "parent_controller.js", parentCode)
      const childFile = createTestSourceFile(project, "child_controller.js", childCode)

      project.projectFiles.push(childFile)
      project.projectFiles.push(parentFile)
      project.projectFiles.push(grandparentFile)

      await project.analyze()

      expect(grandparentFile.classDeclarations.length).toEqual(1)
      expect(grandparentFile.exportDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.importDeclarations.length).toEqual(1)

      const importDeclaration = childFile.importDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(importDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.resolvedClassDeclaration).toEqual(grandparent)
    })
  })
})

import dedent from "dedent"
import path from "path"
import { describe, beforeEach, test, expect } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("resolvedClassDeclaration", () => {
    test("resolve named import class defined in other file", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

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

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

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

      const grandparentFile = new SourceFile(project, path.join(project.projectPath, "grandparent_controller.js"), grandparentCode)
      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

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

      const grandparentFile = new SourceFile(project, path.join(project.projectPath, "grandparent_controller.js"), grandparentCode)
      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

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

      const grandparentFile = new SourceFile(project, path.join(project.projectPath, "grandparent_controller.js"), grandparentCode)
      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

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

      const grandparentFile = new SourceFile(project, path.join(project.projectPath, "grandparent_controller.js"), grandparentCode)
      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

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

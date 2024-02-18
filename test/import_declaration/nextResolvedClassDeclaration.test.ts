import dedent from "dedent"
import path from "path"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ImportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("nextResolvedClassDeclaration", () => {
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
      expect(importDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.nextResolvedClassDeclaration.className).toEqual("ParentController")
      expect(importDeclaration.nextResolvedClassDeclaration).toEqual(parent)
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
      expect(importDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.nextResolvedClassDeclaration.className).toEqual("ParentController")
      expect(importDeclaration.nextResolvedClassDeclaration).toEqual(parent)
    })

    test("resolve named classes through files", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `

      const parentCode = dedent`
        import { GrandparentController } from "./grandparent_controller"

        export class ParentController extends GrandparentController {}
      `

      const childCode = dedent`
        import { ParentController } from "./parent_controller"

        class ChildController extends ParentController {}
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

      const child = childFile.findClass("ChildController")
      const parent = parentFile.findClass("ParentController")
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(child).toBeDefined()
      expect(parent).toBeDefined()
      expect(grandparent).toBeDefined()

      expect(child.nextResolvedClassDeclaration).toBeDefined()
      expect(child.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(child.nextResolvedClassDeclaration).toEqual(parent)
      expect(child.nextResolvedClassDeclaration.className).toEqual("ParentController")
      expect(child.nextResolvedClassDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)
      expect(child.nextResolvedClassDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")

      expect(parent.nextResolvedClassDeclaration).toBeDefined()
      expect(parent.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parent.nextResolvedClassDeclaration).toEqual(grandparent)

      expect(parent.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(parent.nextResolvedClassDeclaration.nextResolvedClassDeclaration).toBeUndefined()

      expect(grandparent.nextResolvedClassDeclaration).toBeUndefined()

      expect(project.relativePath(child.nextResolvedClassDeclaration.sourceFile.path)).toEqual("parent_controller.js")
      expect(project.relativePath(child.nextResolvedClassDeclaration.nextResolvedClassDeclaration.sourceFile.path)).toEqual("grandparent_controller.js")
      expect(project.relativePath(parent.nextResolvedClassDeclaration.sourceFile.path)).toEqual("grandparent_controller.js")
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

      // The next nextResolvedSourceFile is the parent_controller.js SourceFile
      expect(project.relativePath(importDeclaration.nextResolvedSourceFile.path)).toEqual("parent_controller.js")

      // But because the parent_controller.js SourceFile doesn't declare the class, nextResolvedClassDeclaration
      // will resolve to the GrandparentController class in the grandparent_controller.js
      expect(importDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)

      expect(project.relativePath(importDeclaration.nextResolvedClassDeclaration.sourceFile.path)).toEqual("grandparent_controller.js")
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

      // The next nextResolvedSourceFile is the parent_controller.js SourceFile
      expect(project.relativePath(importDeclaration.nextResolvedSourceFile.path)).toEqual("parent_controller.js")

      // But because the parent_controller.js SourceFile doesn't declare the class, nextResolvedClassDeclaration
      // will resolve to the GrandparentController class in the grandparent_controller.js
      expect(importDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)

      expect(project.relativePath(importDeclaration.nextResolvedClassDeclaration.sourceFile.path)).toEqual("grandparent_controller.js")
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

      // The next nextResolvedSourceFile is the parent_controller.js SourceFile
      expect(project.relativePath(importDeclaration.nextResolvedSourceFile.path)).toEqual("parent_controller.js")

      // But because the parent_controller.js SourceFile doesn't declare the class, nextResolvedClassDeclaration
      // will resolve to the GrandparentController class in the grandparent_controller.js
      expect(importDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)

      expect(project.relativePath(importDeclaration.nextResolvedClassDeclaration.sourceFile.path)).toEqual("grandparent_controller.js")
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

      // The next nextResolvedSourceFile is the parent_controller.js SourceFile
      expect(project.relativePath(importDeclaration.nextResolvedSourceFile.path)).toEqual("parent_controller.js")

      // But because the parent_controller.js SourceFile doesn't declare the class, nextResolvedClassDeclaration
      // will resolve to the GrandparentController class in the grandparent_controller.js
      expect(importDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(importDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(importDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(importDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)

      expect(project.relativePath(importDeclaration.nextResolvedClassDeclaration.sourceFile.path)).toEqual("grandparent_controller.js")
    })
  })
})

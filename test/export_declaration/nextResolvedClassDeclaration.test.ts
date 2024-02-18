import dedent from "dedent"
import path from "path"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ExportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("nextResolvedClassDeclaration", () => {
    test("resolve named import class defined in other file", async () => {
      const parentCode = dedent`
        export class ParentController {}
      `
      const childCode = dedent`
        export { ParentController } from "./parent_controller"
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.exportDeclarations.length).toEqual(1)

      const exportDeclaration = childFile.exportDeclarations[0]
      const parent = parentFile.findClass("ParentController")

      expect(parent).toBeDefined()
      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(exportDeclaration.nextResolvedClassDeclaration.className).toEqual("ParentController")
      expect(exportDeclaration.nextResolvedClassDeclaration).toEqual(parent)
    })

    test("resolve default import class defined in other file", async () => {
      const parentCode = dedent`
        export default class ParentController {}
      `
      const childCode = dedent`
        export { default } from "./parent_controller"
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(parentFile.exportDeclarations.length).toEqual(1)
      expect(childFile.exportDeclarations.length).toEqual(1)

      const exportDeclaration = childFile.exportDeclarations[0]
      const parent = parentFile.findClass("ParentController")

      expect(parent).toBeDefined()
      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(exportDeclaration.nextResolvedClassDeclaration.className).toEqual("ParentController")
      expect(exportDeclaration.nextResolvedClassDeclaration).toEqual(parent)
    })

    test("resolve re-export named", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `

      const parentCode = dedent`
        export { GrandparentController } from "./grandparent_controller"
      `

      const childCode = dedent`
        export { GrandparentController } from "./parent_controller"
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
      expect(childFile.exportDeclarations.length).toEqual(1)

      const exportDeclaration = childFile.exportDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(exportDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(exportDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)
    })

    test("resolve re-export default as default", async () => {
      const grandparentCode = dedent`
        export default class GrandparentController {}
      `

      const parentCode = dedent`
        export { default } from "./grandparent_controller"
      `

      const childCode = dedent`
        export { default } from "./parent_controller"
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
      expect(childFile.exportDeclarations.length).toEqual(1)

      const exportDeclaration = childFile.exportDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(exportDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(exportDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)
    })

    test("resolve re-export from default to named", async () => {
      const grandparentCode = dedent`
        export default class GrandparentController {}
      `

      const parentCode = dedent`
        export { default as RenamedController } from "./grandparent_controller"
      `

      const childCode = dedent`
        export { RenamedController } from "./parent_controller"
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
      expect(childFile.exportDeclarations.length).toEqual(1)

      const exportDeclaration = childFile.exportDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(exportDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(exportDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)
    })

    test("resolve re-export from named to default", async () => {
      const grandparentCode = dedent`
        export class GrandparentController {}
      `

      const parentCode = dedent`
        export { GrandparentController as default } from "./grandparent_controller"
      `

      const childCode = dedent`
        export { default } from "./parent_controller"
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
      expect(childFile.exportDeclarations.length).toEqual(1)

      const exportDeclaration = childFile.exportDeclarations[0]
      const grandparent = grandparentFile.findClass("GrandparentController")

      expect(grandparent).toBeDefined()
      expect(exportDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeDefined()
      expect(exportDeclaration.nextResolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(exportDeclaration.nextResolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(exportDeclaration.nextResolvedClassDeclaration).toEqual(grandparent)
    })
  })
})

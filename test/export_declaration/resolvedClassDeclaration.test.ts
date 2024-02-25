import dedent from "dedent"
import path from "path"
import { describe, beforeEach, test, expect } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ExportDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("resolvedClassDeclaration", () => {
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

      const childExport = childFile.exportDeclarations[0]
      const parentExport = parentFile.exportDeclarations[0]

      const parent = parentFile.findClass("ParentController")
      expect(parent).toBeDefined()

      expect(childExport).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(childExport.resolvedClassDeclaration.className).toEqual("ParentController")
      expect(childExport.resolvedClassDeclaration).toEqual(parent)

      expect(parentExport).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parentExport.resolvedClassDeclaration.className).toEqual("ParentController")
      expect(parentExport.resolvedClassDeclaration).toEqual(parent)
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

      const childExport = childFile.exportDeclarations[0]
      const parentExport = parentFile.exportDeclarations[0]

      const parent = parentFile.findClass("ParentController")
      expect(parent).toBeDefined()

      expect(childExport).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(childExport.resolvedClassDeclaration.className).toEqual("ParentController")
      expect(childExport.resolvedClassDeclaration).toEqual(parent)

      expect(parentExport).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parentExport.resolvedClassDeclaration.className).toEqual("ParentController")
      expect(parentExport.resolvedClassDeclaration).toEqual(parent)
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

      const childExport = childFile.exportDeclarations[0]
      const parentExport = parentFile.exportDeclarations[0]
      const grandparentExport = grandparentFile.exportDeclarations[0]

      const grandparent = grandparentFile.findClass("GrandparentController")
      expect(grandparent).toBeDefined()

      expect(childExport).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(childExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(childExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(parentExport).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(parentExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(grandparentExport).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(grandparentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(grandparentExport.resolvedClassDeclaration).toEqual(grandparent)
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

      const childExport = childFile.exportDeclarations[0]
      const parentExport = parentFile.exportDeclarations[0]
      const grandparentExport = grandparentFile.exportDeclarations[0]

      const grandparent = grandparentFile.findClass("GrandparentController")
      expect(grandparent).toBeDefined()

      expect(childExport).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(childExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(childExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(parentExport).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(parentExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(grandparentExport).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(grandparentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(grandparentExport.resolvedClassDeclaration).toEqual(grandparent)
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

      const childExport = childFile.exportDeclarations[0]
      const parentExport = parentFile.exportDeclarations[0]
      const grandparentExport = grandparentFile.exportDeclarations[0]

      const grandparent = grandparentFile.findClass("GrandparentController")
      expect(grandparent).toBeDefined()

      expect(childExport).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(childExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(childExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(parentExport).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(parentExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(grandparentExport).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(grandparentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(grandparentExport.resolvedClassDeclaration).toEqual(grandparent)
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

      const childExport = childFile.exportDeclarations[0]
      const parentExport = parentFile.exportDeclarations[0]
      const grandparentExport = grandparentFile.exportDeclarations[0]

      const grandparent = grandparentFile.findClass("GrandparentController")
      expect(grandparent).toBeDefined()

      expect(childExport).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeDefined()
      expect(childExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(childExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(childExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(parentExport).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeDefined()
      expect(parentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(parentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(parentExport.resolvedClassDeclaration).toEqual(grandparent)

      expect(grandparentExport).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeDefined()
      expect(grandparentExport.resolvedClassDeclaration).toBeInstanceOf(ClassDeclaration)
      expect(grandparentExport.resolvedClassDeclaration.className).toEqual("GrandparentController")
      expect(grandparentExport.resolvedClassDeclaration).toEqual(grandparent)
    })
  })
})

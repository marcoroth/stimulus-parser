import dedent from "dedent"
import path from "path"
import { describe, beforeEach, test, expect } from "vitest"
import { Project, SourceFile, ClassDeclaration, StimulusControllerClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("ClassDeclaration", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("superClass", () => {
    test("regular class", async () => {
      const code = dedent`
        class Child {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const klass = sourceFile.classDeclarations[0]

      expect(klass.superClass).toBeUndefined()
    })

    test("with super class", async () => {
      const code = dedent`
        class Parent {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)

      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.superClass).toEqual(parent)
      expect(child.superClass).toBeInstanceOf(ClassDeclaration)
      expect(child.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(parent.superClass).toBeUndefined()
    })

    test("with Stimulus Controller super class", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Child extends Controller {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)

      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const child = sourceFile.findClass("Child")

      expect(child.superClass).toBeDefined()
      expect(child.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("with Stimulus Controller super class via second class", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Parent extends Controller {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)

      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.superClass).toEqual(parent)
      expect(child.superClass).toBeInstanceOf(ClassDeclaration)
      expect(child.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(parent.superClass).toBeDefined()
      expect(parent.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("with super class called Controller", async () => {
      const code = dedent`
        import { Controller } from "something-else"

        class Parent extends Controller {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.superClass).toEqual(parent)
      expect(child.superClass).toBeInstanceOf(ClassDeclaration)
      expect(child.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(parent).toBeDefined()
      expect(parent.className).toEqual("Parent")
      expect(parent.superClass).toBeUndefined()
    })

    test("with super class name imported from other file", async () => {
      const parentCode = dedent`
        import { Controller } from "@hotwired/stimulus"

        export class ParentController extends Controller {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"

        export class ChildController extends ParentController {}
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(childFile.classDeclarations.length).toEqual(1)

      const child = childFile.findClass("ChildController")
      const parent = parentFile.findClass("ParentController")

      expect(child.className).toEqual("ChildController")
      expect(child.superClass).toBeDefined()
      expect(child.superClass.className).toEqual("ParentController")
      expect(child.superClass).toEqual(parent)
      expect(child.superClass).toBeInstanceOf(ClassDeclaration)
      expect(child.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(parent.className).toEqual("ParentController")
      expect(parent.superClass).toBeDefined()
      expect(parent.superClass.className).toEqual("Controller")
      expect(parent.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("with super class name imported from other file independent of file order", async () => {
      const parentCode = dedent`
        import { Controller } from "@hotwired/stimulus"

        export class ParentController extends Controller {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"

        export class ChildController extends ParentController {}
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(childFile)
      project.projectFiles.push(parentFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(childFile.classDeclarations.length).toEqual(1)

      const child = childFile.findClass("ChildController")
      const parent = parentFile.findClass("ParentController")

      expect(child.className).toEqual("ChildController")
      expect(child.superClass).toBeDefined()
      expect(child.superClass.className).toEqual("ParentController")
      expect(child.superClass).toEqual(parent)
      expect(child.superClass).toBeInstanceOf(ClassDeclaration)
      expect(child.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(parent.className).toEqual("ParentController")
      expect(parent.superClass).toBeDefined()
      expect(parent.superClass.className).toEqual("Controller")
      expect(parent.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("with super class default imported from other file", async () => {
      const parentCode = dedent`
        import { Controller } from "@hotwired/stimulus"

        export default class extends Controller {}
      `
      const childCode = dedent`
        import ParentController from "./parent_controller"

        export class ChildController extends ParentController {}
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(childFile.classDeclarations.length).toEqual(1)

      const child = childFile.findClass("ChildController")
      const parent = parentFile.exportDeclarations.find(exportDecl => exportDecl.type === "default").exportedClassDeclaration

      expect(child.className).toEqual("ChildController")
      expect(child.superClass).toBeDefined()
      expect(child.superClass.className).toEqual(undefined)
      expect(child.superClass).toEqual(parent)
      expect(child.superClass).toBeInstanceOf(ClassDeclaration)
      expect(child.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(parent.className).toEqual(undefined)
      expect(parent.superClass).toBeDefined()
      expect(parent.superClass.className).toEqual("Controller")
      expect(parent.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("adds errors when it cannot resolve named import", async () => {
      const parentCode = dedent`
        import { Controller } from "@hotwired/stimulus"

        export class ParentControllerOops extends Controller {}
      `
      const childCode = dedent`
        import { ParentController } from "./parent_controller"

        export class ChildController extends ParentController {}
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(childFile.classDeclarations.length).toEqual(1)

      const child = childFile.findClass("ChildController")
      const parent = parentFile.findClass("ParentControllerOops")

      expect(child.className).toEqual("ChildController")
      expect(child.superClass).toBeUndefined()

      expect(parent).toBeDefined()
      expect(parentFile.errors.length).toEqual(0)
      expect(parent.className).toEqual("ParentControllerOops")
      expect(parent.superClass).toBeDefined()
      expect(parent.superClass.className).toEqual("Controller")
      expect(parent.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("adds errors when it cannot resolve import", async () => {
      const parentCode = dedent`
        import { Controller } from "@hotwired/stimulus"

        export class ParentController extends Controller {}
      `
      const childCode = dedent`
        import { ParentControllerOops } from "./parent_controller_oops"

        export class ChildController extends ParentController {}
      `

      const parentFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), parentCode)
      const childFile = new SourceFile(project, path.join(project.projectPath, "child_controller.js"), childCode)

      project.projectFiles.push(parentFile)
      project.projectFiles.push(childFile)

      await project.analyze()

      expect(parentFile.classDeclarations.length).toEqual(1)
      expect(childFile.classDeclarations.length).toEqual(1)

      const child = childFile.findClass("ChildController")
      const parent = parentFile.findClass("ParentController")

      expect(child.className).toEqual("ChildController")
      expect(child.superClass).toBeUndefined()

      expect(parent).toBeDefined()
      expect(parent.className).toEqual("ParentController")
      expect(parent.superClass).toBeDefined()
      expect(parent.superClass.className).toEqual("Controller")
      expect(parent.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })
  })
})

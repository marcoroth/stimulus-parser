import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("ClassDeclaration", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("highestAncestor", () => {
    test("regular class", async () => {
      const code = dedent`
        class Child {}
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const klass = sourceFile.classDeclarations[0]

      expect(klass.highestAncestor).toEqual(klass)
      expect(klass.superClass).toBeUndefined()
    })

    test("with super class", async () => {
      const code = dedent`
        class Parent {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.superClass).toEqual(parent)
      expect(parent.superClass).toEqual(undefined)

      expect(child.highestAncestor).toEqual(parent)
      expect(parent.highestAncestor).toEqual(parent)
    })

    test("with two super classes", async () => {
      const code = dedent`
        class Grandparent {}
        class Parent extends Grandparent {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(3)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")
      const grandparent = sourceFile.findClass("Grandparent")

      expect(child.superClass).toEqual(parent)
      expect(parent.superClass).toEqual(grandparent)
      expect(grandparent.superClass).toEqual(undefined)

      expect(child.highestAncestor).toEqual(grandparent)
      expect(parent.highestAncestor).toEqual(grandparent)
      expect(grandparent.highestAncestor).toEqual(grandparent)
    })

    test("with two super classes and one anonymous class", async () => {
      const code = dedent`
        class Grandparent {}
        class Parent extends Grandparent {}
        class Child extends Parent {}

        export default class extends Child {}
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(4)

      const exported = sourceFile.findClass(undefined)
      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")
      const grandparent = sourceFile.findClass("Grandparent")

      expect(exported.superClass).toEqual(child)
      expect(child.superClass).toEqual(parent)
      expect(parent.superClass).toEqual(grandparent)
      expect(grandparent.superClass).toBeUndefined()

      expect(exported.highestAncestor).toEqual(grandparent)
      expect(child.highestAncestor).toEqual(grandparent)
      expect(parent.highestAncestor).toEqual(grandparent)
      expect(grandparent.highestAncestor).toEqual(grandparent)
    })

    test("with two classes with shared super class", async () => {
      const code = dedent`
        class Parent {}
        class FirstChild extends Parent {}
        class SecondChild extends Parent {}
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(3)

      const firstChild = sourceFile.findClass("FirstChild")
      const secondChild = sourceFile.findClass("SecondChild")
      const parent = sourceFile.findClass("Parent")

      expect(firstChild.superClass).toEqual(parent)
      expect(secondChild.superClass).toEqual(parent)
      expect(parent.superClass).toBeUndefined()

      expect(firstChild.highestAncestor).toEqual(parent)
      expect(secondChild.highestAncestor).toEqual(parent)
      expect(parent.highestAncestor).toEqual(parent)
    })
  })
})

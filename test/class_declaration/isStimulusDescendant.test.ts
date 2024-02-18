import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"

const project = new Project(process.cwd())

describe("ClassDeclaration", () => {
  describe("isStimulusDescendant", () => {
    test("regular class", () => {
      const code = dedent`
        class Child {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      sourceFile.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const klass = sourceFile.classDeclarations[0]

      expect(klass.isStimulusDescendant).toEqual(false)
    })

    test("with super class", () => {
      const code = dedent`
        class Parent {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      sourceFile.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.isStimulusDescendant).toEqual(false)
      expect(parent.isStimulusDescendant).toEqual(false)
    })

    test("with Stimulus Controller super class", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Child extends Controller {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      sourceFile.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const child = sourceFile.findClass("Child")

      expect(child.isStimulusDescendant).toEqual(true)
    })

    test("with Stimulus Controller super class via second class", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Parent extends Controller {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      sourceFile.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.isStimulusDescendant).toEqual(true)
      expect(parent.isStimulusDescendant).toEqual(true)
    })

    test("with super class called Controller", () => {
      const code = dedent`
        import { Controller } from "something-else"

        class Parent extends Controller {}
        class Child extends Parent {}
      `

      const sourceFile = new SourceFile(project, "child.js", code)
      sourceFile.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.isStimulusDescendant).toEqual(false)
      expect(parent.isStimulusDescendant).toEqual(false)
    })
  })
})

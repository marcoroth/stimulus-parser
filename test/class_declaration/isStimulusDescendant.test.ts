import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"
import { createTestSourceFile } from "../helpers/temp"

let project = setupProject()

describe("ClassDeclaration", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("isStimulusDescendant", () => {
    test("regular class", async () => {
      const code = dedent`
        class Child {}
      `

      const sourceFile = createTestSourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const klass = sourceFile.classDeclarations[0]

      expect(klass.isStimulusDescendant).toEqual(false)
    })

    test("with super class", async () => {
      const code = dedent`
        class Parent {}
        class Child extends Parent {}
      `

      const sourceFile = createTestSourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.isStimulusDescendant).toEqual(false)
      expect(parent.isStimulusDescendant).toEqual(false)
    })

    test("with Stimulus Controller super class", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Child extends Controller {}
      `

      const sourceFile = createTestSourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)

      const child = sourceFile.findClass("Child")

      expect(child.isStimulusDescendant).toEqual(true)
    })

    test("with Stimulus Controller super class via second class", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Parent extends Controller {}
        class Child extends Parent {}
      `

      const sourceFile = createTestSourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.isStimulusDescendant).toEqual(true)
      expect(parent.isStimulusDescendant).toEqual(true)
    })

    test("with super class called Controller", async () => {
      const code = dedent`
        import { Controller } from "something-else"

        class Parent extends Controller {}
        class Child extends Parent {}
      `

      const sourceFile = createTestSourceFile(project, "child.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(2)

      const child = sourceFile.findClass("Child")
      const parent = sourceFile.findClass("Parent")

      expect(child.isStimulusDescendant).toEqual(false)
      expect(parent.isStimulusDescendant).toEqual(false)
    })
  })
})

import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("ClassDeclaration", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("non stimulus classes", () => {
    test("regular class", async () => {
      const code = dedent`
        class Something {
          connect() {}
          method() {}
          disconnect() {}
        }
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations.length).toEqual(1)
      expect(sourceFile.classDeclarations[0].className).toEqual("Something")
      expect(sourceFile.classDeclarations[0].isStimulusClassDeclaration).toEqual(false)
      expect(sourceFile.controllerDefinitions).toEqual([])
      expect(sourceFile.errors).toHaveLength(0)
    })

    test("imports controller from somewhere", async () => {
      const code = dedent`
        import { Controller } from "somewhere"

        class Something extends Controller {
          connect() {}
          method() {}
          disconnect() {}
        }
      `

      const sourceFile = new SourceFile(project, "something.js", code)

      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeUndefined()
      expect(something.superClassName).toEqual("Controller")
      expect(sourceFile.errors).toHaveLength(0)
      expect(sourceFile.controllerDefinitions).toEqual([])
    })
  })

  describe("extends Stimulus Controller class", () => {
    test("imports and extends controller from Stimulus", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {
          connect() {}
          method() {}
          disconnect() {}
        }
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.controllerDefinitions[0].actionNames).toEqual(["connect", "method", "disconnect"])

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.isStimulusClassDeclaration).toBeTruthy()
      expect(sourceFile.errors).toHaveLength(0)
    })
  })
})

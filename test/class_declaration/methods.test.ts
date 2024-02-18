import dedent from "dedent"
import { describe, expect, test, beforeEach } from "vitest"
import { SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"
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

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusClassDeclaration: false,
      }])
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

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusClassDeclaration: false,
        superClass: undefined,
      }])
      expect(sourceFile.controllerDefinitions).toEqual([])
      expect(sourceFile.errors).toHaveLength(1)
      expect(sourceFile.errors[0].message).toEqual(`Couldn't resolve import "Controller" to a class declaration in "somewhere". Make sure the referenced constant is defining a class.`)
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

      expect(sourceFile.controllerDefinitions[0].methodNames).toEqual(["connect", "method", "disconnect"])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusClassDeclaration: false,
        superClass: {
          className: "Controller",
          isStimulusClassDeclaration: true,
          importDeclaration: {
            localName: "Controller",
            originalName: "Controller",
            source: "@hotwired/stimulus",
            isStimulusImport: true,
            type: "named",
          }
        }
      }])
      expect(sourceFile.errors).toHaveLength(0)
    })
  })
})

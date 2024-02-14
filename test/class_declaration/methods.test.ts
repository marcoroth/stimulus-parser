import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

describe("ClassDeclaration", () => {
  describe("non stimulus classes", () => {
    test("regular class", () => {
      const code = dedent`
        class Something {
          connect() {}
          method() {}
          disconnect() {}
        }
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false
      }])
      expect(sourceFile.controllerDefinitions).toEqual([])
    })

    test("imports controller from somewhere", () => {
      const code = dedent`
        import { Controller } from "somewhere"

        class Something extends Controller {
          connect() {}
          method() {}
          disconnect() {}
        }
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false,
        superClass: {
          className: "Controller",
          isStimulusDescendant: false,
          importDeclaration: {
            localName: "Controller",
            originalName: "Controller",
            source: "somewhere",
            isStimulusImport: false
          }
        }
      }])
      expect(sourceFile.controllerDefinitions).toEqual([])
    })
  })

  describe("extends Stimulus Controller class", () => {
    test("imports and extends controller from Stimulus", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {
          connect() {}
          method() {}
          disconnect() {}
        }
      `

      const sourceFile = new SourceFile(project, "something.js", code)
      sourceFile.analyze()

      expect(sourceFile.controllerDefinitions[0].methodNames).toEqual(["connect", "method", "disconnect"])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration: {
            localName: "Controller",
            originalName: "Controller",
            source: "@hotwired/stimulus",
            isStimulusImport: true
          }
        }
      }])
    })
  })
})

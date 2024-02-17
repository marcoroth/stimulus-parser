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
      }])
      expect(sourceFile.controllerDefinitions).toEqual([])
      expect(sourceFile.errors).toHaveLength(0)
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
        superClass: undefined,
      }])
      expect(sourceFile.controllerDefinitions).toEqual([])
      expect(sourceFile.errors).toHaveLength(1)
      expect(sourceFile.errors[0].message).toEqual(`Couldn't resolve import "Controller" to a class declaration in "somewhere". Make sure the referenced constant is defining a class.`)
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

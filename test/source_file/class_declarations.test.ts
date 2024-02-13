import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

const stimulusControllerSuperClass = {
  className: "Controller",
  importDeclaration: {
    isStimulusImport: true,
    localName: "Controller",
    originalName: "Controller",
    source: "@hotwired/stimulus",
  },
  isStimulusDescendant: true,
  superClass: undefined,
}

describe("SourceFile", () => {
  describe("classDeclarations", () => {
    test("named class", () => {
      const code = `
        class Something {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false,
        superClass: undefined,
      }])
    })

    test("multiple classes", () => {
      const code = `
        class Something {}
        class Better {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusDescendant: false,
          superClass: undefined,
        },
        {
          className: "Better",
          isStimulusDescendant: false,
          superClass: undefined,
        },
      ])
    })

    test("anonymous class", () => {
      const code = `
        export default class {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: undefined,
          isStimulusDescendant: false,
          superClass: undefined,
        },
      ])
    })

    test("anonymous class with extends", () => {
      const code = `
        class Something {}
        export default class extends Something {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusDescendant: false,
          superClass: undefined,
        },
        {
          className: undefined,
          isStimulusDescendant: false,
          superClass: {
            className: "Something",
            isStimulusDescendant: false,
            superClass: undefined,
          },
        },
      ])
    })

    test("named class with superclass", () => {
      const code = `
        class Better {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Better",
          isStimulusDescendant: false,
          superClass: undefined,
        },
        {
          className: "Something",
          isStimulusDescendant: false,
          superClass: {
            className: "Better",
            isStimulusDescendant: false,
            superClass: undefined,
          },
        },
      ])
    })

    test("named class with superclass from import", () => {
      const code = `
        import { Controller } from "better"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusDescendant: false,
          superClass: {
            className: "Controller",
            superClass: undefined,
            isStimulusDescendant: false,
            importDeclaration: {
              originalName: "Controller",
              localName: "Controller",
              source: "better",
              isStimulusImport: false
            }
          },
        },
      ])
    })

    test("named class with superclass from Stimulus Controller import", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusDescendant: true,
          superClass: stimulusControllerSuperClass,
        },
      ])
    })

    test("named class with superclass from import via second class", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"
        class Even extends Controller {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const even = {
        className: "Even",
        isStimulusDescendant: true,
        superClass: stimulusControllerSuperClass,
      }

      const better = {
        className: "Better",
        isStimulusDescendant: true,
        superClass: even,
      }

      const something = {
        className: "Something",
        isStimulusDescendant: true,
        superClass: better
      }

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        even,
        better,
        something,
      ])
    })

    test("named class with superclass from import rename via second class", () => {
      const code = `
        import { Controller as StimulusController } from "@hotwired/stimulus"
        class Even extends StimulusController {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const superClass = {
        ...stimulusControllerSuperClass,
        className: "StimulusController",
        importDeclaration: {
          ...stimulusControllerSuperClass.importDeclaration,
          localName: "StimulusController",
        },
      }

      const even = {
        className: "Even",
        isStimulusDescendant: true,
        superClass: superClass,
      }

      const better = {
        className: "Better",
        isStimulusDescendant: true,
        superClass: even,
      }

      const something = {
        className: "Something",
        isStimulusDescendant: true,
        superClass: better
      }

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        even,
        better,
        something,
      ])
    })
  })
})
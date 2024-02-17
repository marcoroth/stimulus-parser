import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

const stimulusControllerSuperClass = {
  className: "Controller",
  isStimulusClassDeclaration: true,
  superClass: undefined,
  importDeclaration: {
    isStimulusImport: true,
    localName: "Controller",
    originalName: "Controller",
    source: "@hotwired/stimulus",
    type: "named",
  },
}

describe("SourceFile", () => {
  describe("classDeclarations", () => {
    test("named class", () => {
      const code = dedent`
        class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        superClass: undefined,
      }])
    })

    test("multiple classes", () => {
      const code = dedent`
        class Something {}
        class Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          superClass: undefined,
        },
        {
          className: "Better",
          superClass: undefined,
        },
      ])
    })

    test("anonymous class", () => {
      const code = dedent`
        export default class {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: undefined,
          superClass: undefined,
          exportDeclaration: {
            isStimulusExport: false,
            exportedName: undefined,
            localName: undefined,
            type: "default"
          },
        },
      ])
    })

    test("anonymous class with extends", () => {
      const code = dedent`
        class Something {}
        export default class extends Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          superClass: undefined,
        },
        {
          className: undefined,
          exportDeclaration: {
            exportedName: undefined,
            localName: undefined,
            isStimulusExport: false,
            type: "default"
          },
          superClass: {
            className: "Something",
            superClass: undefined,
          },
        },
      ])
    })

    test("named class with superclass", () => {
      const code = dedent`
        class Better {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Better",
          superClass: undefined,
        },
        {
          className: "Something",
          superClass: {
            className: "Better",
            superClass: undefined,
          },
        },
      ])
    })

    test("named class with superclass from import", () => {
      const code = dedent`
        import { Controller } from "better"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          superClass: undefined,
        },
      ])
      expect(sourceFile.errors).toHaveLength(1)
      expect(sourceFile.errors[0].message).toEqual(`Couldn't resolve import "Controller" to a class declaration in "better". Make sure the referenced constant is defining a class.`)
    })

    test("named class with superclass from Stimulus Controller import", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          superClass: stimulusControllerSuperClass,
        },
      ])
    })

    test("anonymous class assigned to variable from Stimulus Controller import", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        const Something = class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          superClass: stimulusControllerSuperClass,
        },
      ])
    })

    test("named class with superclass from import via second class", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Even extends Controller {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      const even = {
        className: "Even",
        superClass: stimulusControllerSuperClass,
      }

      const better = {
        className: "Better",
        superClass: even,
      }

      const something = {
        className: "Something",
        superClass: better
      }

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        even,
        better,
        something,
      ])
    })

    test("named class with superclass from import rename via second class", () => {
      const code = dedent`
        import { Controller as StimulusController } from "@hotwired/stimulus"
        class Even extends StimulusController {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
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
        superClass: superClass,
      }

      const better = {
        className: "Better",
        superClass: even,
      }

      const something = {
        className: "Something",
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

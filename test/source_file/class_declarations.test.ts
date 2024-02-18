import dedent from "dedent"
import { describe, beforeEach, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

let project = new Project(process.cwd())

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
  beforeEach(() => {
    project = new Project(process.cwd())
  })

  describe("classDeclarations", () => {
    test("named class", async () => {
      const code = dedent`
        class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusClassDeclaration: false,
        superClass: undefined,
      }])
    })

    test("multiple classes", async () => {
      const code = dedent`
        class Something {}
        class Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusClassDeclaration: false,
          superClass: undefined,
        },
        {
          className: "Better",
          isStimulusClassDeclaration: false,
          superClass: undefined,
        },
      ])
    })

    test("anonymous class", async () => {
      const code = dedent`
        export default class {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: undefined,
          superClass: undefined,
          isStimulusClassDeclaration: false,
          exportDeclaration: {
            exportedName: undefined,
            localName: undefined,
            type: "default"
          },
        },
      ])
    })

    test("anonymous class with extends", async () => {
      const code = dedent`
        class Something {}
        export default class extends Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusClassDeclaration: false,
          superClass: undefined,
        },
        {
          className: undefined,
          isStimulusClassDeclaration: false,
          exportDeclaration: {
            exportedName: undefined,
            localName: undefined,
            type: "default"
          },
          superClass: {
            className: "Something",
            isStimulusClassDeclaration: false,
            superClass: undefined,
          },
        },
      ])
    })

    test("named class with superclass", async () => {
      const code = dedent`
        class Better {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Better",
          isStimulusClassDeclaration: false,
          superClass: undefined,
        },
        {
          className: "Something",
          isStimulusClassDeclaration: false,
          superClass: {
            className: "Better",
            isStimulusClassDeclaration: false,
            superClass: undefined,
          },
        },
      ])
    })

    test("named class with superclass from import", async () => {
      const code = dedent`
        import { Controller } from "better"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusClassDeclaration: false,
          superClass: undefined,
        },
      ])
      expect(sourceFile.errors).toHaveLength(1)
      expect(sourceFile.errors[0].message).toEqual(`Couldn't resolve import "Controller" to a class declaration in "better". Make sure the referenced constant is defining a class.`)
    })

    test("named class with superclass from Stimulus Controller import", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusClassDeclaration: false,
          superClass: stimulusControllerSuperClass,
        },
      ])
    })

    test("anonymous class assigned to variable from Stimulus Controller import", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        const Something = class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        {
          className: "Something",
          isStimulusClassDeclaration: false,
          superClass: stimulusControllerSuperClass,
        },
      ])
    })

    test("named class with superclass from import via second class", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Even extends Controller {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const even = {
        className: "Even",
        isStimulusClassDeclaration: false,
        superClass: stimulusControllerSuperClass,
      }

      const better = {
        className: "Better",
        isStimulusClassDeclaration: false,
        superClass: even,
      }

      const something = {
        className: "Something",
        isStimulusClassDeclaration: false,
        superClass: better
      }

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        even,
        better,
        something,
      ])
    })

    test("named class with superclass from import rename via second class", async () => {
      const code = dedent`
        import { Controller as StimulusController } from "@hotwired/stimulus"
        class Even extends StimulusController {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const superClass = {
        ...stimulusControllerSuperClass,
        className: "StimulusController",
        isStimulusClassDeclaration: true,
        importDeclaration: {
          ...stimulusControllerSuperClass.importDeclaration,
          localName: "StimulusController",
        },
      }

      const even = {
        className: "Even",
        isStimulusClassDeclaration: false,
        superClass: superClass,
      }

      const better = {
        className: "Better",
        isStimulusClassDeclaration: false,
        superClass: even,
      }

      const something = {
        className: "Something",
        isStimulusClassDeclaration: false,
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

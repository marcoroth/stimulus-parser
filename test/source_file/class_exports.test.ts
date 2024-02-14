import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  describe("class exports", () => {
    test("export named class", () => {
      const code = dedent`
        class Something {}
        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: false,
        type: "named",
        source: undefined,
      }

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false,
        superClass: undefined,
        exportDeclaration
      }])
    })

    test("import and export named class", () => {
      const code = dedent`
        import { SuperClass } from "./super_class"

        class Something extends SuperClass {}

        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: false,
        localName: "SuperClass",
        originalName: "SuperClass",
        source: "./super_class"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: false,
        type: "named",
        source: undefined,
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false,
        superClass: {
          className: "SuperClass",
          isStimulusDescendant: false,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export named Controller", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: true,
        type: "named",
        source: undefined,
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export named Controller with alias", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export { Something as SomethingController }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "SomethingController",
        localName: "Something",
        isStimulusExport: true,
        type: "named",
        source: undefined,
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export named class in-line", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export class Something extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: true,
        type: "named"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export default Controller", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export default Something
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: true,
        type: "default",
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export default Controller in single statement", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export default class Something extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: true,
        type: "default"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export default anonymous Controller class in single statement", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export default class extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: true,
        type: "default"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: undefined,
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and default export anonymous class assinged to const", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        const Something = class extends Controller {}

        export default Something
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: true,
        type: "default"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and name export anonymous class assigned to const", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        const Something = class extends Controller {}

        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: true,
        type: "named"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and name export anonymous class assigned to const inline", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export const Something = class extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: true,
        type: "named"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and name export anonymous class assigned to const via class declaration", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}
        const AnotherThing = class extends Something {}

        export { AnotherThing }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "AnotherThing",
        localName: "AnotherThing",
        isStimulusExport: true,
        type: "named"
      }

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      const something = {
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        }
      }

      const anotherThing = {
        className: "AnotherThing",
        isStimulusDescendant: true,
        superClass: something,
        exportDeclaration
      }

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([
        something,
        anotherThing
      ])
    })
  })
})

import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  describe("importDeclarations", () => {
    test("file import", () => {
      const code = dedent`
        import "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([])
    })

    test("default import", () => {
      const code = dedent`
        import Something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "Something",
        originalName: undefined,
        source: "something"
      }])
    })

    test("named import", () => {
      const code = dedent`
        import { something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "something",
        originalName: "something",
        source: "something"
      }])
    })

    test("named import with rename", () => {
      const code = dedent`
        import { something as somethingElse } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "somethingElse",
        originalName: "something",
        source: "something"
      }])
    })

    test("namespace import", () => {
      const code = dedent`
        import * as something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "something",
        originalName: undefined,
        source: "something"
      }])
    })

    test("mixed import", () => {
      const code = dedent`
        import onething, { anotherthing, thirdthing as something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([
        {
          isStimulusImport: false,
          localName: "onething",
          originalName: undefined,
          source: "something"
        },
        {
          isStimulusImport: false,
          localName: "anotherthing",
          originalName: "anotherthing",
          source: "something"
        },
        {
          isStimulusImport: false,
          localName: "something",
          originalName: "thirdthing",
          source: "something"
        }
      ])
    })

    test("import default as", () => {
      const code = dedent`
        import { default as something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([
        {
          isStimulusImport: false,
          localName: "something",
          originalName: undefined,
          source: "something"
        }
      ])
    })

    test("type import", () => {
      const code = dedent`
        import type { something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "something",
        originalName: "something",
        source: "something"
      }])
    })

    test("stimulus controller import", () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }])
    })

    test("stimulus controller import with alias", () => {
      const code = dedent`
        import { Controller as StimulusController } from "@hotwired/stimulus"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: true,
        localName: "StimulusController",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }])
    })
  })
})

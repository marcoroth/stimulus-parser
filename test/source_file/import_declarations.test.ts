import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  describe("importDeclarations", () => {
    test("file import", () => {
      const code = `
        import "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([])
    })

    test("default import", () => {
      const code = `
        import Something from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "Something",
        originalName: undefined,
        source: "something"
      }])
    })

    test("named import", () => {
      const code = `
        import { something } from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "something",
        originalName: "something",
        source: "something"
      }])
    })

    test("named import with rename", () => {
      const code = `
        import { something as somethingElse } from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "somethingElse",
        originalName: "something",
        source: "something"
      }])
    })

    test("namespace import", () => {
      const code = `
        import * as something from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "something",
        originalName: undefined,
        source: "something"
      }])
    })

    test("mixed import", () => {
      const code = `
        import onething, { anotherthing, thirdthing as something } from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
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

    test("type import", () => {
      const code = `
        import type { something } from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: false,
        localName: "something",
        originalName: "something",
        source: "something"
      }])
    })

    test("stimulus controller import", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.importDeclarations)).toEqual([{
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }])
    })

    test("stimulus controller import with alias", () => {
      const code = `
        import { Controller as StimulusController } from "@hotwired/stimulus"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
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

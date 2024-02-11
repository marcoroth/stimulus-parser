import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import type { ImportDeclaration } from "../../src/types"

const project = new Project(process.cwd())

const importCompare = (importDeclarations: ImportDeclaration[]) => {
  importDeclarations.forEach(importDeclaration => delete importDeclaration.node)

  return importDeclarations
}

describe("SourceFile", () => {
  describe("importDeclarations", () => {
    test("file import", () => {
      const code = `
        import "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(importCompare(sourceFile.importDeclarations)).toEqual([])
    })

    test("default import", () => {
      const code = `
        import Something from "something"
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      expect(importCompare(sourceFile.importDeclarations)).toEqual([{
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

      expect(importCompare(sourceFile.importDeclarations)).toEqual([{
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

      expect(importCompare(sourceFile.importDeclarations)).toEqual([{
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

      expect(importCompare(sourceFile.importDeclarations)).toEqual([{
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

      expect(importCompare(sourceFile.importDeclarations)).toEqual([
        {
          localName: "onething",
          originalName: undefined,
          source: "something"
        },
        {
          localName: "anotherthing",
          originalName: "anotherthing",
          source: "something"
        },
        {
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

      expect(importCompare(sourceFile.importDeclarations)).toEqual([{
        localName: "something",
        originalName: "something",
        source: "something"
      }])
    })
  })
})

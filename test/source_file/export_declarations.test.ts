import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  describe("exportDeclarations", () => {
    test("export default", () => {
      const code = dedent`
        export default Something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export named variable", () => {
      const code = dedent`
        const something = "something"
        export { something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export named class", () => {
      const code = dedent`
        class Something {}
        export { Something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export object", () => {
      const code = dedent`
        export {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([])
    })

    test("export function", () => {
      const code = dedent`
        export function something() {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export default named function ", () => {
      const code = dedent`
        function something() {}

        export default something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export named arrow function ", () => {
      const code = dedent`
        export const something = () => {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export default named arrow function", () => {
      const code = dedent`
        const something = () => {}

        export default something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export const", () => {
      const code = dedent`
        export const something = 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export let", () => {
      const code = dedent`
        export let something = 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export var", () => {
      const code = dedent`
        export var something = 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export default const", () => {
      const code = dedent`
        const something = 0

        export default something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default literal", () => {
      const code = dedent`
        export default 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default anonymous function ", () => {
      const code = dedent`
        export default function() {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default anonymous arrow function ", () => {
      const code = dedent`
        export default () => {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default anonymous array expression", () => {
      const code = dedent`
        export default []
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default anonymous object expression", () => {
      const code = dedent`
        export default {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export named with rename", () => {
      const code = dedent`
        export { something as somethingElse }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "somethingElse",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export named mulitple", () => {
      const code = dedent`
        export { something, somethingElse }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([
        {
          exportedName: "something",
          localName: "something",
          isStimulusExport: false,
          type: "named"
        },
        {
          exportedName: "somethingElse",
          localName: "somethingElse",
          isStimulusExport: false,
          type: "named"
        }
      ])
    })

    test("export namespace", () => {
      const code = dedent`
        export * from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "namespace",
        source: "something"
      }])
    })

    test("export namespace with rename", () => {
      const code = dedent`
        export * as something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: undefined,
        isStimulusExport: false,
        type: "namespace",
        source: "something"
      }])
    })

    test("export default from namespace", () => {
      const code = dedent`
        export { default } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default",
        source: "something"
      }])
    })

    test("export default with rename from namespace", () => {
      const code = dedent`
        export { default as something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: undefined,
        isStimulusExport: false,
        type: "named",
        source: "something"
      }])
    })

    test("export named as default", () => {
      const code = dedent`
        function something() {}

        export { something as default }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export named with rename from", () => {
      const code = dedent`
        export { something as somethingElse } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "somethingElse",
        localName: "something",
        isStimulusExport: false,
        type: "named",
        source: "something"
      }])
    })

    test("export class", () => {
      const code = dedent`
        export class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export default class", () => {
      const code = dedent`
        class Something {}

        export default Something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default class inline", () => {
      const code = dedent`
        export default class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default named function inline", () => {
      const code = dedent`
        export default function something() {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default named arrow function inline", () => {
      const code = dedent`
        export default something = () => {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: "something",
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default anonymous class", () => {
      const code = dedent`
        export default class {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export default anonymous class with extends", () => {
      const code = dedent`
        export default class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: false,
        type: "default"
      }])
    })

    test("export type", () => {
      const code = dedent`
        export type { something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export type from namespace", () => {
      const code = dedent`
        export type { something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: "something",
        source: "something",
        isStimulusExport: false,
        type: "named"
      }])
    })

    test("export type * namespace", () => {
      const code = dedent`
        export type * from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: undefined,
        localName: undefined,
        source: "something",
        isStimulusExport: false,
        type: "namespace"
      }])
    })

    test("export type * with rename from namespace", () => {
      const code = dedent`
        export type * as something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      sourceFile.analyze()

      expect(stripSuperClasses(sourceFile.exportDeclarations)).toEqual([{
        exportedName: "something",
        localName: undefined,
        source: "something",
        isStimulusExport: false,
        type: "namespace"
      }])
    })
  })
})

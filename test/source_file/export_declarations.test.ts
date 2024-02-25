import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("exportDeclarations", () => {
    test("export default", async () => {
      const code = dedent`
        export default Something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export named variable", async () => {
      const code = dedent`
        const something = "something"
        export { something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export named class", async () => {
      const code = dedent`
        class Something {}
        export { Something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export object", async () => {
      const code = dedent`
        export {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(0)
    })

    test("export function", async () => {
      const code = dedent`
        export function something() {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export default named function ", async () => {
      const code = dedent`
        function something() {}

        export default something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export named arrow function ", async () => {
      const code = dedent`
        export const something = async () => {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export default named arrow function", async () => {
      const code = dedent`
        const something = async () => {}

        export default something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export const", async () => {
      const code = dedent`
        export const something = 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export let", async () => {
      const code = dedent`
        export let something = 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export var", async () => {
      const code = dedent`
        export var something = 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export default const", async () => {
      const code = dedent`
        const something = 0

        export default something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default literal", async () => {
      const code = dedent`
        export default 0
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default anonymous function ", async () => {
      const code = dedent`
        export default function() {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default anonymous arrow function ", async () => {
      const code = dedent`
        export default async () => {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default anonymous array expression", async () => {
      const code = dedent`
        export default []
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default anonymous object expression", async () => {
      const code = dedent`
        export default {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export named with rename", async () => {
      const code = dedent`
        export { something as somethingElse }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("somethingElse")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export named mulitple", async () => {
      const code = dedent`
        export { something, somethingElse }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(2)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
      expect(sourceFile.exportDeclarations[1].exportedName).toEqual("somethingElse")
      expect(sourceFile.exportDeclarations[1].localName).toEqual("somethingElse")
      expect(sourceFile.exportDeclarations[1].type).toEqual("named")
    })

    test("export namespace", async () => {
      const code = dedent`
        export * from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("namespace")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export namespace with rename", async () => {
      const code = dedent`
        export * as something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("namespace")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export default from namespace", async () => {
      const code = dedent`
        export { default } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export default with rename from namespace", async () => {
      const code = dedent`
        export { default as something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export named as default", async () => {
      const code = dedent`
        function something() {}

        export { something as default }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export named with rename from", async () => {
      const code = dedent`
        export { something as somethingElse } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("somethingElse")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export class", async () => {
      const code = dedent`
        export class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export default class", async () => {
      const code = dedent`
        class Something {}

        export default Something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default class inline", async () => {
      const code = dedent`
        export default class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default named function inline", async () => {
      const code = dedent`
        export default function something() {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default named arrow function inline", async () => {
      const code = dedent`
        export default something = async () => {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default anonymous class", async () => {
      const code = dedent`
        export default class {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export default anonymous class with extends", async () => {
      const code = dedent`
        export default class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")
    })

    test("export type", async () => {
      const code = dedent`
        export type { something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()
      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
    })

    test("export type from namespace", async () => {
      const code = dedent`
        export type { something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export type * namespace", async () => {
      const code = dedent`
        export type * from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("namespace")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })

    test("export type * with rename from namespace", async () => {
      const code = dedent`
        export type * as something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual(undefined)
      expect(sourceFile.exportDeclarations[0].type).toEqual("namespace")
      expect(sourceFile.exportDeclarations[0].source).toEqual("something")
    })
  })
})

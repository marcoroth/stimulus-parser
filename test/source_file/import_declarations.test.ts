import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("SourceFile", async () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("importDeclarations", async () => {
    test("file import", async () => {
      const code = dedent`
        import "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations).toEqual([])
    })

    test("default import", async () => {
      const code = dedent`
        import Something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.findImport("Something").isRenamedImport).toEqual(false)

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toEqual(false)
      expect(sourceFile.importDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.importDeclarations[0].originalName).toEqual(undefined)
      expect(sourceFile.importDeclarations[0].source).toEqual("something")
      expect(sourceFile.importDeclarations[0].type).toEqual("default")
    })

    test("named import", async () => {
      const code = dedent`
        import { something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isRenamedImport).toEqual(false)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toEqual(false)
      expect(sourceFile.importDeclarations[0].localName).toEqual("something")
      expect(sourceFile.importDeclarations[0].originalName).toEqual("something")
      expect(sourceFile.importDeclarations[0].source).toEqual("something")
      expect(sourceFile.importDeclarations[0].type).toEqual("named")
    })

    test("named import with rename", async () => {
      const code = dedent`
        import { something as somethingElse } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isRenamedImport).toEqual(true)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toEqual(false)
      expect(sourceFile.importDeclarations[0].localName).toEqual("somethingElse")
      expect(sourceFile.importDeclarations[0].originalName).toEqual("something")
      expect(sourceFile.importDeclarations[0].source).toEqual("something")
      expect(sourceFile.importDeclarations[0].type).toEqual("named")
    })

    test("namespace import", async () => {
      const code = dedent`
        import * as something from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.findImport("something").isRenamedImport).toEqual(false)

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toEqual(false)
      expect(sourceFile.importDeclarations[0].localName).toEqual("something")
      expect(sourceFile.importDeclarations[0].originalName).toEqual(undefined)
      expect(sourceFile.importDeclarations[0].source).toEqual("something")
      expect(sourceFile.importDeclarations[0].type).toEqual("namespace")
    })

    test("mixed import", async () => {
      const code = dedent`
        import onething, { anotherthing, thirdthing as something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(3)

      const anotherthing = sourceFile.findImport("anotherthing")
      const something = sourceFile.findImport("something")
      const onething = sourceFile.findImport("onething")

      expect(onething.isRenamedImport).toEqual(false)
      expect(onething.isStimulusImport).toEqual(false)
      expect(onething.localName).toEqual("onething")
      expect(onething.originalName).toEqual(undefined)
      expect(onething.source).toEqual("something")
      expect(onething.type).toEqual("default")

      expect(anotherthing.isRenamedImport).toEqual(false)
      expect(anotherthing.isStimulusImport).toEqual(false)
      expect(anotherthing.localName).toEqual("anotherthing")
      expect(anotherthing.originalName).toEqual("anotherthing")
      expect(anotherthing.source).toEqual("something")
      expect(anotherthing.type).toEqual("named")

      expect(something.isRenamedImport).toEqual(true)
      expect(something.isStimulusImport).toEqual(false)
      expect(something.localName).toEqual("something")
      expect(something.originalName).toEqual("thirdthing")
      expect(something.source).toEqual("something")
      expect(something.type).toEqual("named")
    })

    test("import default as", async () => {
      const code = dedent`
        import { default as something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findImport("something")

      // this is technically a "renamed" import, but it doesn't make a difference
      // this is equivalent to `import something from "something"`
      expect(something.isRenamedImport).toEqual(false)
      expect(something.isStimulusImport).toEqual(false)
      expect(something.localName).toEqual("something")
      expect(something.originalName).toEqual(undefined)
      expect(something.source).toEqual("something")
      expect(something.type).toEqual("default")
    })

    test("type import", async () => {
      const code = dedent`
        import type { something } from "something"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findImport("something")

      expect(something.isRenamedImport).toEqual(false)
      expect(something.isStimulusImport).toEqual(false)
      expect(something.localName).toEqual("something")
      expect(something.originalName).toEqual("something")
      expect(something.source).toEqual("something")
      expect(something.type).toEqual("named")
    })

    test("stimulus controller import", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const controller = sourceFile.findImport("Controller")

      expect(controller.isRenamedImport).toEqual(false)
      expect(controller.isStimulusImport).toEqual(true)
      expect(controller.localName).toEqual("Controller")
      expect(controller.originalName).toEqual("Controller")
      expect(controller.source).toEqual("@hotwired/stimulus")
      expect(controller.type).toEqual("named")
    })

    test("stimulus controller import with alias", async () => {
      const code = dedent`
        import { Controller as StimulusController } from "@hotwired/stimulus"
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const controller = sourceFile.findImport("StimulusController")

      expect(controller.isRenamedImport).toEqual(true)
      expect(controller.isStimulusImport).toEqual(true)
      expect(controller.localName).toEqual("StimulusController")
      expect(controller.originalName).toEqual("Controller")
      expect(controller.source).toEqual("@hotwired/stimulus")
      expect(controller.type).toEqual("named")
    })
  })
})

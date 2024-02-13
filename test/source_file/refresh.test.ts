import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { mockFile } from "../helpers/mock"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  describe("refresh", () => {
    test("refreshes content", async () => {
      const sourceFile = new SourceFile("file.js", "initial", project)

      expect(sourceFile.content).toEqual("initial")

      mockFile("updated")

      await sourceFile.refresh()
      expect(sourceFile.content).toEqual("updated")
    })

    test("refreshes class declarations", async () => {
      const sourceFile = new SourceFile("file.js", "", project)

      expect(sourceFile.classDeclarations.length).toEqual(0)

      mockFile(`class Class {}`)

      await sourceFile.refresh()
      expect(sourceFile.classDeclarations.length).toEqual(1)

      mockFile(`
        class Class {}
        class Another {}
      `)

      await sourceFile.refresh()
      expect(sourceFile.classDeclarations.length).toEqual(2)
    })
  })
})

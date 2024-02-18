import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { mockFile } from "../helpers/mock"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("refresh", () => {
    test("refreshes content", async () => {
      const sourceFile = new SourceFile(project, "file.js", "initial")

      expect(sourceFile.content).toEqual("initial")

      mockFile("updated")

      await sourceFile.refresh()
      expect(sourceFile.content).toEqual("updated")
    })

    test("refreshes class declarations", async () => {
      const sourceFile = new SourceFile(project, "file.js", "")

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

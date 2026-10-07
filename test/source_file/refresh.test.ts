import { describe, beforeEach, test, expect } from "vitest"
import { mockFile } from "../helpers/mock"
import { setupProject } from "../helpers/setup"
import { createTestSourceFile } from "../helpers/temp"

let project = setupProject()

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("refresh", () => {
    test("refreshes class declarations", async () => {
      const sourceFile = createTestSourceFile(project, "file.js", "")

      await sourceFile.initialize()
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

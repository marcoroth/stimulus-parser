import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"
import { createTestSourceFile } from "../helpers/temp"

let project = setupProject()

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject()
  })

  test("parses with content", async () => {
    const sourceFile = createTestSourceFile(project, "abc.js", "")

    expect(sourceFile.errors.length).toEqual(0)
    expect(sourceFile.controllerDefinitions).toEqual([])

    await sourceFile.initialize()

    expect(sourceFile.errors.length).toEqual(0)
    expect(sourceFile.controllerDefinitions).toEqual([])
  })

  test("doesn't parse with no content", async () => {
    const sourceFile = new SourceFile(project, "nonexistent_file.js")

    expect(sourceFile.errors).toHaveLength(0)

    await sourceFile.initialize()

    expect(sourceFile.errors).toHaveLength(1)
    expect(sourceFile.errors[0].message).toEqual("Error reading file")
    expect(sourceFile.controllerDefinitions).toEqual([])
  })
})

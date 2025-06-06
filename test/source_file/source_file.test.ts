import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject()
  })

  test("parses with content", () => {
    const sourceFile = new SourceFile(project, "abc.js", "")

    expect(sourceFile.hasContent).toEqual(true)
    expect(sourceFile.errors.length).toEqual(0)
    expect(sourceFile.controllerDefinitions).toEqual([])
    expect(sourceFile.ast).toBeUndefined()

    sourceFile.initialize()

    expect(sourceFile.hasContent).toEqual(true)
    expect(sourceFile.errors.length).toEqual(0)
    expect(sourceFile.controllerDefinitions).toEqual([])
    expect(sourceFile.ast).toEqual({
      body: [],
      comments: [],
      loc: {
        end: {
          column: 0,
          line: 1,
        },
        start: {
          column: 0,
          line: 1,
        },
      },
      range: [0, 0],
      sourceType: "module",
      tokens: [],
      type: "Program",
    })
  })

  test("doesn't parse with no content", () => {
    const sourceFile = new SourceFile(project, "abc.js", undefined)

    expect(sourceFile.ast).toBeUndefined()
    expect(sourceFile.hasContent).toEqual(false)
    expect(sourceFile.errors).toHaveLength(0)

    sourceFile.parse()

    expect(sourceFile.ast).toBeUndefined()
    expect(sourceFile.hasContent).toEqual(false)
    expect(sourceFile.errors).toHaveLength(1)
    expect(sourceFile.errors[0].message).toEqual("File content hasn't been read yet")
    expect(sourceFile.controllerDefinitions).toEqual([])
  })
})

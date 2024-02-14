import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../src"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  test("parses with content", () => {
    const sourceFile = new SourceFile(project, "abc.js", "")

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
      sourceType: "script",
      tokens: [],
      type: "Program",
    })

    expect(sourceFile.errors.length).toEqual(0)
    expect(sourceFile.controllerDefinitions).toEqual([])
  })

  test("doesn't parse with no content", () => {
    const sourceFile = new SourceFile(project, "abc.js", undefined)

    expect(sourceFile.ast).toBeUndefined()
    expect(sourceFile.errors.length).toEqual(1)
    expect(sourceFile.errors[0].message).toEqual("File content hasn't been read yet")
    expect(sourceFile.controllerDefinitions).toEqual([])
  })
})

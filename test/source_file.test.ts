import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../src"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  test("parses", () => {
    const sourceFile = new SourceFile("abc.js", "", project)

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

    expect(sourceFile.controllerDefinitions).toEqual([])
  })
})

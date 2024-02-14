import { describe, test, expect } from "vitest"
import { Project } from "../../../src"
import { hasDepedency } from "../../../src/util/npm"

const project = new Project(process.cwd())

describe("util.npm", () => {
  describe("hasDepedency", () => {
    test("has dependency", async () => {
      expect(await hasDepedency(project.projectPath, "acorn")).toEqual(true)
    })

    test("doesn't have dependency", async() => {
      expect(await hasDepedency(project.projectPath, "some-package")).toEqual(false)
    })
  })
})

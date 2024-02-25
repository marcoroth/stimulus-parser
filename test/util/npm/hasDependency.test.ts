import { describe, beforeEach, test, expect } from "vitest"
import { hasDepedency } from "../../../src/util/npm"
import { setupProject } from "../../helpers/setup"

let project = setupProject()

describe("util.npm", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("hasDepedency", () => {
    test("has dependency", async () => {
      expect(await hasDepedency(project.projectPath, "acorn")).toEqual(true)
    })

    test("doesn't have dependency", async() => {
      expect(await hasDepedency(project.projectPath, "some-package")).toEqual(false)
    })
  })
})

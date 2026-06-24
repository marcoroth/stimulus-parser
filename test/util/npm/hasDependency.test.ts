import { describe, beforeEach, test, expect } from "vitest"
import { hasDepedency } from "../../../src/util/npm"
import { setupProject } from "../../helpers/setup"

let project = setupProject("app")

describe("util.npm", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  describe("hasDepedency", () => {
    test("has dependency", async () => {
      expect(await hasDepedency(project.projectPath, "@hotwired/stimulus")).toEqual(true)
    })

    test("doesn't have dependency", async() => {
      expect(await hasDepedency(project.projectPath, "some-package")).toEqual(false)
    })
  })
})

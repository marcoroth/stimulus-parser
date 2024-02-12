import { describe, test, expect } from "vitest"
import { Project } from "../../src"
import * as util from "../../src/util/npm"

const project = new Project(process.cwd())

describe("util.npm", () => {
  describe("hasDepedency", () => {
    test("has dependency", async () => {
      expect(await util.hasDepedency(project.projectPath, "acorn")).toEqual(true)
    })

    test("doesn't have dependency", async() => {
      expect(await util.hasDepedency(project.projectPath, "some-package")).toEqual(false)
    })
  })

  describe("findNodeModulesPath", () => {
    test("for root directory", async() => {
      expect(await util.findNodeModulesPath(project.projectPath)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for any directory", async () => {
      expect(await util.findNodeModulesPath(`${project.projectPath}/test/packages`)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for top-level file", async () => {
      expect(await util.findNodeModulesPath(`${project.projectPath}/package.json`)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for any file", async () => {
      expect(await util.findNodeModulesPath(`${project.projectPath}/test/packages/util.test.ts`)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for directory outside project", async () => {
      const splits = project.projectPath.split("/")
      const path = splits.slice(0, splits.length - 1).join("/")

      expect(await util.findNodeModulesPath(path)).toEqual(null)
    })
  })
})

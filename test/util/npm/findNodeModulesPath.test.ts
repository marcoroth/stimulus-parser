import { describe, beforeEach, test, expect } from "vitest"
import { findNodeModulesPath } from "../../../src/util/npm"
import { setupProject } from "../../helpers/setup"

let project = setupProject()

describe("util.npm", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("findNodeModulesPath", () => {
    test("for root directory", async() => {
      expect(await findNodeModulesPath(project.projectPath)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for any directory", async () => {
      expect(await findNodeModulesPath(`${project.projectPath}/test/packages`)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for top-level file", async () => {
      expect(await findNodeModulesPath(`${project.projectPath}/package.json`)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for any file", async () => {
      expect(await findNodeModulesPath(`${project.projectPath}/test/packages/util.test.ts`)).toEqual(`${project.projectPath}/node_modules`)
    })

    test("for directory outside project", async () => {
      const splits = project.projectPath.split("/")
      const path = splits.slice(0, splits.length - 2).join("/")

      expect(await findNodeModulesPath(path)).toEqual(null)
    })
  })
})

import { describe, beforeEach, test, expect } from "vitest"
import { findNodeModulesPath } from "../../../src/util/npm"
import { setupProject } from "../../helpers/setup"

let project = setupProject("app")

describe("util.npm", () => {
  beforeEach(() => {
    project = setupProject("app")
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
      expect(await findNodeModulesPath("/tmp/nonexistent-directory")).toEqual(null)
    })
  })
})

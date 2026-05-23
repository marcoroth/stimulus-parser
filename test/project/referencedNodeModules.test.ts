import { describe, beforeEach, test, expect } from "vitest"
import { Project } from "../../src/project"
import { setupProject } from "../helpers/setup"
import { createTestSourceFile } from "../helpers/temp"

let project: Project

describe("Project", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("referencedNodeModules", () => {
    test("empty by default", () => {
      expect(Array.from(project.referencedNodeModules)).toEqual([])
    })

    test("detects default import", async () => {
      const sourceFile = createTestSourceFile(project, "abc.js", `import Something from "somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      await project.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual(["somewhere"])
    })

    test("detects named import", async () => {
      const sourceFile = createTestSourceFile(project, "abc.js", `import { Something } from "somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      await project.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual(["somewhere"])
    })

    test("doesn't detect relative import", async () => {
      const sourceFile = createTestSourceFile(project, "abc.js", `import { Something } from "./somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      await project.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual([])
    })
  })
})

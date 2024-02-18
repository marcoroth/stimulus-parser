import { describe, expect, test, beforeEach } from "vitest"
import { Project } from "../../src/project"
import { SourceFile } from "../../src/source_file"
import { setupProject } from "../helpers/setup"

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
      const sourceFile = new SourceFile(project, "abc.js", `import Something from "somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      await project.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual(["somewhere"])
    })

    test("detects named import", async () => {
      const sourceFile = new SourceFile(project, "abc.js", `import { Something } from "somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      await project.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual(["somewhere"])
    })

    test("doesn't detect relative import", async () => {
      const sourceFile = new SourceFile(project, "abc.js", `import { Something } from "./somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      await project.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual([])
    })
  })
})

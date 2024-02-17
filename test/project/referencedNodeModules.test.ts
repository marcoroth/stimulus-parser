import { describe, expect, test, beforeEach } from "vitest"
import { Project } from "../../src/project"
import { SourceFile } from "../../src/source_file"

let project: Project

describe("Project", () => {
  beforeEach(() => {
    project = new Project(process.cwd())
  })

  describe("referencedNodeModules", () => {
    test("empty by default", () => {
      expect(Array.from(project.referencedNodeModules)).toEqual([])
    })

    test("detects default import", () => {
      const sourceFile = new SourceFile(project, "abc.js", `import Something from "somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      sourceFile.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual(["somewhere"])
    })

    test("detects named import", () => {
      const sourceFile = new SourceFile(project, "abc.js", `import { Something } from "somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      sourceFile.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual(["somewhere"])
    })

    test("doesn't detect relative import", () => {
      const sourceFile = new SourceFile(project, "abc.js", `import { Something } from "./somewhere"`)
      project.projectFiles.push(sourceFile)

      expect(Array.from(project.referencedNodeModules)).toEqual([])

      sourceFile.analyze()

      expect(Array.from(project.referencedNodeModules)).toEqual([])
    })
  })
})

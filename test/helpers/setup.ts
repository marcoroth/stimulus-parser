import path from "path"
import { beforeEach } from "vitest"
import { Parser, Project } from "../../src"

export const setupProject = (fixture?: string): Project => {
  let projectPath = process.cwd()

  if (fixture) {
    projectPath = path.join(process.cwd(), "test", "fixtures", fixture)
  }

  return new Project(projectPath)
}

export const setupParser = (): Parser => {
  const project = setupProject()
  let parser = new Parser(project)

  beforeEach(() => {
    parser = new Parser(project)
  })

  return parser
}

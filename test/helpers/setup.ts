import { beforeEach } from "vitest"
import { Parser, Project } from "../../src"

export const setupProject = (): Project => {
  return new Project(process.cwd())
}

export const setupParser = (): Parser => {
  const project = setupProject()
  let parser = new Parser(project)

  beforeEach(() => {
    parser = new Parser(project)
  })

  return parser
}

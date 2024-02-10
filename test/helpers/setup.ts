import { beforeEach } from "vitest"
import { Parser, Project } from "../../src"

export const setupParser = () => {
  const project = new Project(process.cwd())
  let parser = new Parser(project)

  beforeEach(() => {
    parser = new Parser(project)
  })

  return parser
}

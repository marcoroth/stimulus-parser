import { beforeEach } from "vitest"
import { Parser, Project } from "../../src"

export const setupParserTest = () => {
  const project = new Project("/Users/marcoroth/Development/stimulus-parser")
  let parser = new Parser(project)

  beforeEach(() => {
    parser = new Parser(project)
  })

  return parser
}

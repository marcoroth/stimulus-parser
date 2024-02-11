import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"

export class SourceFile {
  readonly path: string
  readonly content: string
  readonly project: Project

  public controllerDefinitions: ControllerDefinition[] = []

  constructor(path: string, content: string, project: Project) {
    this.path = path
    this.content = content
    this.project = project
  }

  parse() {
    this.project.parser.parse(this.content, this.path)
  }
}

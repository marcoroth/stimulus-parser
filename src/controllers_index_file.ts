import type { Project } from "./project"
import type { RegisteredController } from "./registered_controller"
import type { SourceFile } from "./source_file"

export class ControllersIndexFile {
  public readonly project: Project
  public readonly registeredControllers: RegisteredController[] = []
  public readonly sourceFile: SourceFile

  public readonly fallbackPath: string = "app/javascript/controllers/index.js"

  constructor(project: Project, sourceFile: SourceFile){
    this.project = project
    this.sourceFile = sourceFile
  }

  get path() {
    return this.sourceFile.path
  }
}

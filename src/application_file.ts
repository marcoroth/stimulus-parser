import type { Project } from "./project"
import type { SourceFile } from "./source_file"
import type { RegisteredController } from "./registered_controller"
import type { ApplicationType } from "./types"

export class ApplicationFile {
  public readonly project: Project
  public readonly registeredControllers: RegisteredController[] = []
  public readonly sourceFile: SourceFile
  public readonly mode: ApplicationType

  constructor(project: Project, sourceFile: SourceFile, mode: ApplicationType = "esbuild"){
    this.project = project
    this.sourceFile = sourceFile
    this.mode = mode
  }

  get path() {
    return this.sourceFile.path
  }

  get applicationImport() {
    return this.sourceFile.stimulusApplicationImport
  }
}

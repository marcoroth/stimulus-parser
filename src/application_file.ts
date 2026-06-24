import type { Project } from "./project"
import type { SourceFile } from "./source_file"
import type { RegisteredController } from "./registered_controller"
import type { ApplicationType } from "./types"
import type { ImportDeclaration } from "./import_declaration"
import type { ExportDeclaration } from "./export_declaration"

export class ApplicationFile {
  public readonly project: Project
  public readonly registeredControllers: RegisteredController[] = []
  public readonly sourceFile: SourceFile
  public readonly mode: ApplicationType
  public readonly localApplicationConstant: string | null

  constructor(project: Project, sourceFile: SourceFile, localApplicationConstant: string | null, mode: ApplicationType = "esbuild"){
    this.project = project
    this.sourceFile = sourceFile
    this.mode = mode
    this.localApplicationConstant = localApplicationConstant
  }

  get path() {
    return this.sourceFile.path
  }

  get applicationImport(): ImportDeclaration | undefined {
    return this.sourceFile.stimulusApplicationImport
  }

  get exportDeclaration(): ExportDeclaration | undefined {
    if (!this.localApplicationConstant) return

    return this.sourceFile.findExport(this.localApplicationConstant)
  }

  get exportedApplicationConstant() {
    return this.exportDeclaration?.exportedName
  }
}

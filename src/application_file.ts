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

  constructor(project: Project, sourceFile: SourceFile, mode: ApplicationType = "esbuild"){
    this.project = project
    this.sourceFile = sourceFile
    this.mode = mode
  }

  get path() {
    return this.sourceFile.path
  }

  get applicationImport(): ImportDeclaration | undefined {
    return this.sourceFile.stimulusApplicationImport
  }

  get exportDeclaration(): ExportDeclaration | undefined {
    // TODO: this should trace from the application import, to the variable declaration to the export
    // return this.sourceFile.exportDeclarations.find(declaration => declaration.localName === this.applicationImport?.localName)
    return this.sourceFile.exportDeclarations[0]
  }
}

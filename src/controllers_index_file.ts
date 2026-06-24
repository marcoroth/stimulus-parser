import type { Project } from "./project"
import type { SourceFile } from "./source_file"
import type { ImportDeclaration } from "./import_declaration"
import type { RegisteredController } from "./registered_controller"

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

  get applicationImport(): ImportDeclaration | undefined {
    return this.sourceFile.importDeclarations.find(declaration =>
      declaration.originalName === this.project.applicationFile?.exportDeclaration?.exportedName && declaration.originalName !== undefined
    )
  }

  get localApplicationConstant() {
    return this.applicationImport?.localName || this.sourceFile.stimulusApplicationImport?.localName
  }
}

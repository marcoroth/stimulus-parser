import path from "path"

import type * as Acorn from "acorn"
import type { NodeModule } from "./node_module"
import type { SourceFile } from "./source_file"
import type { ClassDeclaration } from "./class_declaration"
import type { ControllerDefinition} from "./controller_definition"

export class ImportDeclaration {
  public readonly sourceFile: SourceFile
  public readonly originalName?: string
  public readonly localName: string
  public readonly source: string
  public readonly isStimulusImport: boolean
  public readonly node: Acorn.ImportDeclaration

  constructor(sourceFile: SourceFile, args: { originalName?: string, localName: string, source: string, isStimulusImport: boolean, node: Acorn.ImportDeclaration}) {
    this.sourceFile = sourceFile
    this.originalName = args.originalName
    this.localName = args.localName
    this.source = args.source
    this.isStimulusImport = args.isStimulusImport
    this.node = args.node
  }

  get project() {
    return this.sourceFile.project
  }

  get isRelativeImport() {
    return this.source.startsWith(".")
  }

  get isNodeModuleImport() {
    return !this.isRelativeImport
  }

  get resolvedRelativePath(): string | undefined {
    if (this.isRelativeImport) {
      const thisFolder = path.dirname(this.sourceFile.path)
      const folder = path.dirname(this.source)
      let file = path.basename(this.source)

      if (!file.endsWith(this.sourceFile.fileExtension)) {
        file += this.sourceFile.fileExtension
      }

      return path.join(thisFolder, folder, file)
    }

    return undefined
  }

  get resolvedNodeModule(): NodeModule | undefined {
    if (this.resolvedRelativePath) return

    // TODO: account for exportmaps
    const nodeModule = this.project.detectedNodeModules.find(node => node.name === this.source)

    if (nodeModule) return nodeModule

    return undefined
  }

  get resolvedPath() {
    if (this.resolvedRelativePath) return this.resolvedRelativePath
    if (this.resolvedNodeModule) return this.resolvedNodeModule.entrypoint

    return undefined
  }

  get resolvedSourceFile(): SourceFile | undefined {
    if (!this.resolvedPath) return

    return this.project.projectFiles.find(file => file.path === this.resolvedPath)
  }

  get resolvedClassDeclaration(): ClassDeclaration | undefined {
    if (!this.resolvedSourceFile) return

    // const classDeclaration = this.resolvedSourceFile.findClass(this.originalName)
    // if (classDeclaration) return classDeclaration
    //
    // const importDeclaration = this.resolvedSourceFile.importDeclarations.find(declaration => declaration.originalName === this.originalName)
    // if (importDeclaration) return importDeclaration.resolvedClassDeclaration

    const exportDeclaration = this.resolvedSourceFile.exportDeclarations.find(declaration => declaration.exportedName === this.originalName)
    if (exportDeclaration) return exportDeclaration.resolvedClassDeclaration
  }

  get resolvedControllerDefinition(): ControllerDefinition | undefined {
    if (!this.resolvedClassDeclaration) return

    return this.resolvedClassDeclaration.controllerDefinition
  }

  get resolvedStimulusControllerDefinition(): ControllerDefinition | undefined {
    if (!this.resolvedControllerDefinition) return
    if (!this.resolvedControllerDefinition.isStimulusExport) return

    return this.resolvedControllerDefinition
  }
}

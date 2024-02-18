import path from "path"

import type * as Acorn from "acorn"
import type { NodeModule } from "./node_module"
import type { SourceFile } from "./source_file"
import type { ClassDeclaration } from "./class_declaration"
import type { ExportDeclaration } from "./export_declaration"
import type { ControllerDefinition} from "./controller_definition"

export type ImportDeclarationType = "default" | "named" | "namespace"

type ImportDeclarationArgs = {
  type: ImportDeclarationType
  originalName?: string
  localName: string
  source: string
  isStimulusImport: boolean // TODO: check if this really needs to be in the args on initialization
  node: Acorn.ImportDeclaration
}

export class ImportDeclaration {
  public readonly sourceFile: SourceFile
  public readonly originalName?: string
  public readonly localName: string
  public readonly source: string
  public readonly type: ImportDeclarationType
  public readonly isStimulusImport: boolean
  public readonly node: Acorn.ImportDeclaration

  constructor(sourceFile: SourceFile, args: ImportDeclarationArgs) {
    this.sourceFile = sourceFile
    this.originalName = args.originalName
    this.localName = args.localName
    this.source = args.source
    this.isStimulusImport = args.isStimulusImport
    this.node = args.node
    this.type = args.type
  }

  get project() {
    return this.sourceFile.project
  }

  get isRenamedImport(): boolean {
    if (this.type !== "named") return false

    return this.originalName !== this.localName
  }

  get isNodeModuleImport() {
    return !this.isRelativeImport
  }

  get isRelativeImport() {
    return this.source.startsWith(".")
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

  get resolvedNodeModuleSourceFile(): SourceFile | undefined {
    return this.resolvedNodeModule?.resolvedSourceFile
  }

  get nextResolvedPath() {
    if (this.resolvedRelativePath) return this.resolvedRelativePath
    if (this.resolvedNodeModule) return this.resolvedNodeModule.resolvedPath

    return undefined
  }

  get resolvedPath() {
    return this.resolvedClassDeclaration?.sourceFile.path
  }

  get resolvedSourceFile(): SourceFile | undefined {
    return this.resolvedClassDeclaration?.sourceFile
  }

  get nextResolvedSourceFile(): SourceFile | undefined {
    if (!this.nextResolvedPath) return

    return this.project.allSourceFiles.find(file => file.path === this.nextResolvedPath)
  }

  get resolvedExportDeclaration(): ExportDeclaration | undefined {
    return this.nextResolvedExportDeclaration?.highestAncestor
  }

  get nextResolvedExportDeclaration(): ExportDeclaration | undefined {
    const sourceFile = this.nextResolvedSourceFile

    if (!sourceFile) return

    const exports = sourceFile.exportDeclarations

    if (this.type === "default") return sourceFile.defaultExport
    if (this.type === "namespace") throw new Error("Implement namespace imports")

    return exports.find(declaration => declaration.exportedName === this.originalName)
  }

  get resolvedClassDeclaration(): ClassDeclaration | undefined {
    return this.nextResolvedClassDeclaration?.highestAncestor
  }

  get nextResolvedClassDeclaration(): ClassDeclaration | undefined {
    return this.nextResolvedExportDeclaration?.exportedClassDeclaration
  }

  get resolvedControllerDefinition(): ControllerDefinition | undefined {
    return this.resolvedClassDeclaration?.controllerDefinition
  }

  get inspect(): object {
    return {
      type: this.type,
      localName: this.localName,
      originalName: this.originalName,
      source: this.source,
      sourceFile: this.sourceFile?.path,
    }
  }
}

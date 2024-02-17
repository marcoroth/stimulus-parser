import path from "path"

import type * as Acorn from "acorn"
import type { NodeModule } from "./node_module"
import type { SourceFile } from "./source_file"
import type { ClassDeclaration } from "./class_declaration"
import type { ExportDeclaration } from "./export_declaration"
import type { ControllerDefinition} from "./controller_definition"

export type ImportDeclarationType = "default" | "named" | "namespace"

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

  get resolveNextClassDeclaration(): ClassDeclaration | undefined {
    return this.resolvedClassDeclaration
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

    if (this.resolvedNodeModule && this.resolvedNodeModule.entrypointSourceFile) {
      const { exportDeclarations } = this.resolvedNodeModule.entrypointSourceFile

      if (this.type === "default") {
        const exportDeclaration = exportDeclarations.find(declaration => declaration.type === "default")

        if (exportDeclaration) {
          return exportDeclaration.resolvedPath
        }
      } else if (this.type === "named") {
        const exportDeclaration = exportDeclarations.find(declaration => declaration.exportedName === this.originalName)

        if (exportDeclaration) {
          return exportDeclaration.resolvedPath
        }
      } else {
        // TODO
        throw new Error(`throwing to resolve type: ${this.type}`)
      }
    }

    return undefined
  }

  get resolvedSourceFile(): SourceFile | undefined {
    if (!this.resolvedPath) return

    return this.project.allSourceFiles.find(file => file.path === this.resolvedPath)
  }

  get resolvedExportDeclaration(): ExportDeclaration | undefined {
    if (!this.resolvedSourceFile) return

    if (this.type === "default") return this.resolvedSourceFile.exportDeclarations.find(exportDeclaration => exportDeclaration.type === "default")
    if (this.type === "namespace") throw new Error("Implement namespace imports")

    return this.resolvedSourceFile.exportDeclarations.find(exportDeclaration => exportDeclaration.exportedName === this.originalName)
  }

  get resolvedClassDeclaration(): ClassDeclaration | undefined {
    if (!this.resolvedExportDeclaration) return

    // const classDeclaration = this.resolvedSourceFile.findClass(this.originalName)
    // if (classDeclaration) return classDeclaration
    //
    // const importDeclaration = this.resolvedSourceFile.importDeclarations.find(declaration => declaration.originalName === this.originalName)
    // if (importDeclaration) return importDeclaration.resolvedClassDeclaration

    // const exportDeclaration = this.resolvedSourceFile.exportDeclarations.find(declaration => declaration.exportedName === this.originalName)
    // if (exportDeclaration) return exportDeclaration.resolvedClassDeclaration

    const classDeclaration = this.resolvedExportDeclaration.exportedClassDeclaration

    if (classDeclaration) return classDeclaration

    return undefined
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

import path from "path"

import type * as Acorn from "acorn"
import type { SourceFile } from "./source_file"
import type { NodeModule } from "./node_module"
import type { ClassDeclaration } from "./class_declaration"
import type { ControllerDefinition } from "./controller_definition"

export class ExportDeclaration {
  public readonly sourceFile: SourceFile
  public readonly exportedName?: string
  public readonly localName?: string
  public readonly source?: string
  public readonly type: "default" | "named" | "namespace"
  public readonly node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration

  constructor(sourceFile: SourceFile, args: { exportedName?: string, localName?: string, source?: string, type: "default" | "named" | "namespace", node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration}) {
    this.sourceFile = sourceFile
    this.exportedName = args.exportedName
    this.localName = args.localName
    this.source = args.source
    this.type = args.type
    this.node = args.node
  }

  get project() {
    return this.sourceFile.project
  }

  get isStimulusExport(): boolean {
    return this.exportedClassDeclaration?.isStimulusDescendant || false
  }

  get highestAncestor() {
    return this.ancestors.reverse()[0]
  }

  get ancestors(): ExportDeclaration[] {
    if (!this.nextResolvedExportDeclaration) {
      return [this]
    }

    return [this, ...this.nextResolvedExportDeclaration.ancestors]
  }

  get isRelativeExport(): boolean {
    if (!this.source) return false

    return this.source.startsWith(".")
  }

  get isNodeModuleExport() {
    return !this.isRelativeExport
  }

  get exportedClassDeclaration(): ClassDeclaration | undefined {
    return (
      this.sourceFile.classDeclarations.find(klass => klass.exportDeclaration === this) ||
      this.sourceFile.importDeclarations.find(declaration => declaration.localName === this.localName)?.nextResolvedClassDeclaration ||
      this.nextResolvedExportDeclaration?.exportedClassDeclaration
    )
  }

  get resolvedRelativePath(): string | undefined {
    if (this.isRelativeExport && this.source) {
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

  get resolvedRelativeSourceFile(): SourceFile | undefined {
    if (!this.resolvedRelativePath) return

    return this.project.allSourceFiles.find(file => file.path === this.resolvedRelativePath)
  }

  get resolvedNodeModule(): NodeModule | undefined {
    if (this.resolvedRelativePath) return undefined

    // TODO: account for exportmaps
    const nodeModule = this.project.detectedNodeModules.find(node => node.name === this.source)

    if (nodeModule) return nodeModule

    return undefined
  }

  get resolvedNodeModuleSourceFile(): SourceFile | undefined {
    return this.resolvedNodeModule?.resolvedSourceFile
  }

  get resolvedPath(): string | undefined {
    return this.resolvedClassDeclaration?.sourceFile.path
  }

  get nextResolvedPath() {
    if (this.resolvedRelativePath) return this.resolvedRelativePath
    if (this.resolvedNodeModule) return this.resolvedNodeModule.resolvedPath

    return undefined
  }

  get resolvedSourceFile(): SourceFile | undefined {
    return this.resolvedClassDeclaration?.highestAncestor.sourceFile
  }

  get nextResolvedSourceFile(): SourceFile | undefined {
    if (this.resolvedRelativePath) return this.resolvedRelativeSourceFile
    if (this.resolvedNodeModule) return this.resolvedNodeModuleSourceFile

    return undefined
  }

  get resolvedExportDeclaration(): ExportDeclaration | undefined {
    return this.resolvedClassDeclaration?.highestAncestor.exportDeclaration
  }

  get nextResolvedExportDeclaration(): ExportDeclaration | undefined {
    const sourceFile = this.nextResolvedSourceFile

    if (!sourceFile) return undefined

    // Re-exports
    if (this.source) {
      if (this.type === "default" && this.localName) {
        return sourceFile.exportDeclarations.find(declaration => declaration.exportedName === this.localName)
      } else if (this.type === "default") {
        return sourceFile.defaultExport
      } else if (this.type === "named" && this.localName === undefined) {
        return sourceFile.defaultExport
      } else if (this.type === "named") {
        return sourceFile.exportDeclarations.find(declaration => declaration.type === "named" && declaration.exportedName === this.exportedName)
      } else if (this.type === "namespace"){
        throw new Error("Tried to resolve namespace re-export")
      }
    }

    // Regular exports
    if (this.type === "default") {
      return sourceFile.defaultExport
    } else if (this.type === "named") {
      return sourceFile.exportDeclarations.find(declaration => declaration.type === "named" && declaration.exportedName === this.exportedName)
    } else if (this.type === "namespace"){
      throw new Error("Tried to resolve namespace export")
    }
  }

  get resolvedClassDeclaration(): ClassDeclaration | undefined {
    return this.nextResolvedClassDeclaration?.highestAncestor
  }

  get nextResolvedClassDeclaration(): ClassDeclaration | undefined {
    if (this.exportedClassDeclaration) return this.exportedClassDeclaration
    if (this.nextResolvedExportDeclaration) return this.nextResolvedExportDeclaration.nextResolvedClassDeclaration

    return undefined
  }

  get resolvedControllerDefinition(): ControllerDefinition | undefined {
    return this.resolvedClassDeclaration?.controllerDefinition
  }

  get inspect(): object {
    return {
      type: this.type,
      source: this.source,
      localName: this.localName,
      exportedName: this.exportedName,
      exportedFrom: this.sourceFile?.path,
    }
  }
}

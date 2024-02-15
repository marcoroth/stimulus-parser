import path from "path"

import type * as Acorn from "acorn"
import type { SourceFile } from "./source_file"
import type { NodeModule } from "./node_module"
import type { ClassDeclaration } from "./class_declaration"
import type { ControllerDefinition } from "./controller_definition"

export class ExportDeclaration {
  public readonly sourceFile: SourceFile
  public readonly exportedName?: string
  public readonly localName?: string
  public readonly source?: string
  public readonly isStimulusExport: boolean
  public readonly type: "default" | "named" | "namespace"
  public readonly node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration

  constructor(sourceFile: SourceFile, args: { exportedName?: string, localName?: string, source?: string, isStimulusExport: boolean, type: "default" | "named" | "namespace", node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration}) {
    this.sourceFile = sourceFile
    this.exportedName = args.exportedName
    this.localName = args.localName
    this.source = args.source
    this.isStimulusExport = args.isStimulusExport
    this.type = args.type
    this.node = args.node
  }

  get project() {
    return this.sourceFile.project
  }

  get isRelativeImport(): boolean {
    if (!this.source) return false

    return this.source.startsWith(".")
  }

  get isNodeModuleImport() {
    return !this.isRelativeImport
  }

  get exportedClassDeclaration() {
    return this.sourceFile.classDeclarations.find(klass => klass.exportDeclaration === this)
  }

  get resolveNextClassDeclaration() {
    return this.exportedClassDeclaration
  }

  get resolvedRelativePath(): string | undefined {
    if (this.isRelativeImport && this.source) {
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
    if (this.resolvedRelativePath) return undefined

    // TODO: account for exportmaps
    const nodeModule = this.project.detectedNodeModules.find(node => node.name === this.source)

    if (nodeModule) return nodeModule

    return undefined
  }

  get resolvedPath(): string | undefined {
    if (this.resolvedRelativePath) return this.resolvedRelativePath

    if (this.resolvedNodeModule && this.resolvedNodeModule.entrypointSourceFile) {
      throw new Error("resolved node module")
    }

    if (this.exportedClassDeclaration) {
      const klass = this.exportedClassDeclaration.highestAncestor

      if (klass && klass.importDeclaration) {
        return klass.importDeclaration.resolvedPath
      }
    }

    return undefined
  }

  get resolvedSourceFile(): SourceFile | undefined {
    if (!this.resolvedPath) return undefined

    return this.project.allSourceFiles.find(file => file.path === this.resolvedPath)
  }

  get resolvedExportDeclaration(): ExportDeclaration | undefined {
    if (!this.resolvedSourceFile) return undefined

    if (this.type === "default") {
      return this.resolvedSourceFile.exportDeclarations.find(declaration => declaration.type === "default")
    } else if (this.type === "named") {
      return this.resolvedSourceFile.exportDeclarations.find(declaration => declaration.type === "named" && declaration.exportedName === this.localName)
    } else if (this.type === "namespace"){
      return undefined
    }
  }

  get resolvedClassDeclaration(): ClassDeclaration | undefined {
    if (this.exportedClassDeclaration) {
      const ancestor = this.exportedClassDeclaration.highestAncestor

      if (ancestor.importDeclaration) {
        return ancestor.importDeclaration.resolvedClassDeclaration
      }
    }

    if (this.exportedClassDeclaration) {
      return this.exportedClassDeclaration
    }

    if (this.resolvedExportDeclaration) {
      return this.resolvedExportDeclaration.resolvedClassDeclaration
    }

    return undefined
  }

  get resolvedControllerDefinition(): ControllerDefinition | undefined {
    if (!this.resolvedClassDeclaration) return undefined

    return this.resolvedClassDeclaration.controllerDefinition
  }
}

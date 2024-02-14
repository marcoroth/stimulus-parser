import path from "path"

import type * as Acorn from "acorn"
import type { SourceFile } from "./source_file"
import type { ClassDeclaration } from "./class_declaration"

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

  get resolvedPath(): string | undefined {
    if (this.source?.startsWith(".")) {
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

  get resolvedSourceFile(): SourceFile | undefined {
    if (!this.resolvedPath) return undefined

    return this.project.sourceFiles.find(file => file.path === this.resolvedPath)
  }

  get resolvedExportDeclaration(): ExportDeclaration | undefined {
    if (!this.resolvedSourceFile) return undefined

    if (this.type === "default" || (this.type === "named" && this.localName === "default")) {
      return this.resolvedSourceFile.exportDeclarations.find(declaration => declaration.type === "default")
    } else if (this.type === "named") {
      return this.resolvedSourceFile.exportDeclarations.find(declaration => declaration.type === "named" && declaration.exportedName === this.localName)
    } else if (this.type === "namespace"){
      return undefined
    }
  }

  get resolvedClassDeclaration(): ClassDeclaration | undefined {
    if (this.resolvedExportDeclaration) {
      return this.resolvedExportDeclaration.resolvedClassDeclaration
    }

    // TODO: is this the right logic?
    const classDeclaration = this.sourceFile.classDeclarations.find(klass => klass.exportDeclaration === this)

    if (classDeclaration) return classDeclaration

    return undefined
  }
}

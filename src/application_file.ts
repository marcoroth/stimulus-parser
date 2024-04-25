import { walk } from "./util/walk"

import type * as Acorn from "acorn"
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

  get localApplicationConstant() {
    const importName = this.applicationImport?.localName

    if (!importName) return

    let localName = null

    walk(this.sourceFile.ast, {
      VariableDeclaration: (node: Acorn.VariableDeclaration) => {

        node.declarations.forEach(declarator => {
          if (declarator.id?.type !== "Identifier") return
          if (declarator.init?.type !== "CallExpression") return

          const call = declarator.init

          if (call.callee.type !== "MemberExpression") return
          if (call.callee.object.type !== "Identifier") return
          if (call.callee.property.type !== "Identifier") return

          if (call.callee.object.name !== importName) return
          if (call.callee.property.name !== "start") return

          localName = declarator.id.name
        })
      }
    })

    return localName
  }

  get exportDeclaration(): ExportDeclaration | undefined {
    if (!this.localApplicationConstant) return

    return this.sourceFile.findExport(this.localApplicationConstant)
  }

  get exportedApplicationConstant() {
    return this.exportDeclaration?.exportedName
  }
}

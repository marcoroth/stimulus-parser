import { SourceFile } from "./source_file"
import { ControllerDefinition } from "./controller_definition"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"

import type * as Acorn from "acorn"
import type { Project } from "./project"

export class ClassDeclaration {
  public readonly isStimulusClassDeclaration: boolean = false
  public readonly sourceFile: SourceFile
  public readonly className?: string
  public readonly superClassName?: string
  public readonly loc?: Acorn.SourceLocation | null

  public isAnalyzed: boolean = false
  public importDeclaration?: ImportDeclaration // TODO: technically a class can be imported more than once
  public exportDeclaration?: ExportDeclaration // TODO: technically a class can be exported more than once
  public controllerDefinition?: ControllerDefinition

  constructor(sourceFile: SourceFile, className?: string, superClassName?: string, loc?: Acorn.SourceLocation | null) {
    this.sourceFile = sourceFile
    this.className = className
    this.superClassName = superClassName
    this.loc = loc
  }

  get superClass(): ClassDeclaration | undefined {
    if (!this.superClassName) return

    const classDeclaration = this.sourceFile.classDeclarations.find(i => i.className === this.superClassName)
    const importDeclaration = this.sourceFile.importDeclarations.find(i => i.localName === this.superClassName)
    const stimulusController = (importDeclaration && importDeclaration?.isStimulusImport) ? new StimulusControllerClassDeclaration(this.sourceFile.project, importDeclaration) : undefined

    return (
      classDeclaration || importDeclaration?.nextResolvedClassDeclaration || stimulusController
    )
  }

  get isStimulusDescendant() {
    return !!this.highestAncestor.superClass?.importDeclaration?.isStimulusImport
  }

  get isExported(): boolean {
    return !!this.exportDeclaration
  }

  get highestAncestor(): ClassDeclaration {
    return this.ancestors.reverse()[0]
  }

  get ancestors(): ClassDeclaration[] {
    if (!this.nextResolvedClassDeclaration) {
      return [this]
    }

    return [this, ...this.nextResolvedClassDeclaration.ancestors]
  }

  get nextResolvedClassDeclaration(): ClassDeclaration | undefined {
    if (this.superClass) {
      if (this.superClass.importDeclaration) {
        return this.superClass.nextResolvedClassDeclaration
      }
      return this.superClass
    }

    if (this.importDeclaration) {
      return this.importDeclaration.nextResolvedClassDeclaration
    }

    return
  }

  get inspect(): object {
    return {
      className: this.className,
      superClass: this.superClass?.inspect,
      isStimulusDescendant: this.isStimulusDescendant,
      isExported: this.isExported,
      sourceFile: this.sourceFile?.path,
      hasControllerDefinition: !!this.controllerDefinition,
      controllerDefinition: this.controllerDefinition?.inspect
    }
  }
}

export class StimulusControllerClassDeclaration extends ClassDeclaration {
  public readonly isStimulusClassDeclaration: boolean = true

  constructor(project: Project, importDeclaration: ImportDeclaration) {
    super(new SourceFile(project, "stimulus/controller.js"), importDeclaration.localName || "Controller")
    this.importDeclaration = importDeclaration
  }

  get isStimulusDescendant() {
    return true
  }

  get nextResolvedClassDeclaration() {
    return undefined
  }
}

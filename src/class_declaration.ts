import * as ast from "./util/ast"
import * as decorators from "./util/decorators"
import * as properties from "./util/properties"
import { walk } from "./util/walk"

import { ParseError } from "./parse_error"
import { SourceFile } from "./source_file"
import { ControllerDefinition } from "./controller_definition"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"
import { MethodDefinition } from "./controller_property_definition"

import type * as Acorn from "acorn"
import type { TSESTree } from "@typescript-eslint/typescript-estree"
import type { Project } from "./project"
import type { ClassDeclarationNode } from "./types"

export class ClassDeclaration {
  public readonly isStimulusClassDeclaration: boolean = false
  public readonly sourceFile: SourceFile
  public readonly className?: string
  public readonly node?: ClassDeclarationNode

  public isAnalyzed: boolean = false
  public importDeclaration?: ImportDeclaration // TODO: technically a class can be imported more than once
  public exportDeclaration?: ExportDeclaration // TODO: technically a class can be exported more than once
  public controllerDefinition?: ControllerDefinition

  constructor(sourceFile: SourceFile, className?: string, node?: ClassDeclarationNode) {
    this.sourceFile = sourceFile
    this.className = className
    this.node = node
  }

  get shouldParse() {
    return this.isStimulusDescendant
  }

  get superClassNode(): Acorn.Expression | undefined | null {
    return this.node?.superClass
  }

  get superClassName(): string | undefined {
    if (this.superClassNode?.type !== "Identifier") return

    return this.superClassNode.name
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

  // TODO: check if this is right and makes sense
  // get exportDeclaration(): ExportDeclaration | undefined {
  //   return this.sourceFile.exportDeclarations.find(exportDeclaration => exportDeclaration.exportedClassDeclaration === this);
  // }

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

  analyze() {
    if (!this.shouldParse) return
    if (this.isAnalyzed) return

    this.controllerDefinition = new ControllerDefinition(this.sourceFile.project, this)

    this.analyzeStaticPropertiesExpressions()
    this.analyzeClassDecorators()
    this.analyzeMethods()
    this.analyzeDecorators()
    this.analyzeStaticProperties()

    this.validate()

    this.isAnalyzed = true
  }

  analyzeStaticPropertiesExpressions() {
    if (!this.controllerDefinition) return

    this.sourceFile.analyzeStaticPropertiesExpressions(this.controllerDefinition)
  }

  analyzeClassDecorators() {
    if (!this.node) return
    if (!this.controllerDefinition) return

    this.controllerDefinition.isTyped = !!decorators.extractDecorators(this.node).find(decorator =>
      (decorator.expression.type === "Identifier") ? decorator.expression.name === "TypedController" : false
    )
  }

  analyzeMethods() {
    if (!this.node) return

    walk(this.node, {
      MethodDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.kind !== "method") return
        if (node.key.type !== "Identifier" && node.key.type !== "PrivateIdentifier") return

        const tsNode = (node as unknown as TSESTree.MethodDefinition)
        const methodName = ast.extractIdentifier(node.key) as string
        const isPrivate = node.key.type === "PrivateIdentifier" || tsNode.accessibility === "private"
        const name = isPrivate ? `#${methodName}` : methodName

        this.controllerDefinition.methodDefinitions.push(new MethodDefinition(name, node, node.loc, "static"))
      },

      PropertyDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.key.type !== "Identifier") return
        if (!node.value || node.value.type !== "ArrowFunctionExpression") return

        this.controllerDefinition.methodDefinitions.push(new MethodDefinition(node.key.name, node, node.loc, "static"))
      },
    })
  }

  analyzeStaticProperties() {
    if (!this.node) return

    walk(this.node, {
      PropertyDefinition: node => {
        if (!node.value) return
        if (!node.static) return
        if (node.key.type !== "Identifier") return

        properties.parseStaticControllerProperties(this.controllerDefinition, node.key, node.value)
      }
    })
  }

  analyzeDecorators() {
    if (!this.node) return

    walk(this.node, {
      PropertyDefinition: _node => {
        const node = _node as unknown as TSESTree.PropertyDefinition

        decorators.extractDecorators(_node).forEach(decorator => {
          if (node.key.type !== "Identifier") return

          decorators.parseDecorator(this.controllerDefinition, node.key.name, decorator, node)
        })
      }
    })
  }

  public validate() {
    if (!this.controllerDefinition) return

    if (this.controllerDefinition.anyDecorator && !this.controllerDefinition.isTyped) {
      this.controllerDefinition.errors.push(
        new ParseError("LINT", "Controller needs to be decorated with @TypedController in order to use decorators.", this.node?.loc),
      )
    }

    if (!this.controllerDefinition.anyDecorator && this.controllerDefinition.isTyped) {
      this.controllerDefinition.errors.push(
        new ParseError("LINT", "Controller was decorated with @TypedController but Controller didn't use any decorators.", this.node?.loc),
      )
    }
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

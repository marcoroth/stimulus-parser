import { simple } from "acorn-walk"

import * as Acorn from "acorn"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"

import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions, ImportDeclaration, ExportDeclaration, ClassDeclaration, IdentifiableNode } from "./types"

export class SourceFile {
  readonly path: string
  readonly content: string
  readonly project: Project

  public ast?: AST<ParserOptions>
  public controllerDefinitions: ControllerDefinition[] = []
  public importDeclarations: ImportDeclaration[] = []
  public exportDeclarations: ExportDeclaration[] = []
  public classDeclarations: ClassDeclaration[] = []

  constructor(path: string, content: string, project: Project) {
    this.path = path
    this.content = content
    this.project = project

    this.parse()
  }

  parse() {
    this.ast = this.project.parser.parse(this.content, this.path)
  }

  analyze() {
    this.analyzeImportDeclarations()
    this.analyzeExportDeclarations()
    this.analyzeClassDeclarations()

    const controllerDefinitions = this.project.parser.parseSourceFile(this)
    const controllerDefinition = this.project.parser.parseController(this.content, this.path)

    this.project.controllerDefinitions.push(controllerDefinition)
    this.project.controllerDefinitions.push(...controllerDefinitions)
  }

  analyzeImportDeclarations() {
    simple(this.ast as any, {
      ImportDeclaration: (node: Acorn.ImportDeclaration) => {
        node.specifiers.forEach(specifier => {
          const originalName = (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined
          const source = this.extractLiteral(node.source) || ""
          const isStimulusImport = (originalName === "Controller" && source === "@hotwired/stimulus")

          this.importDeclarations.push({
            originalName,
            localName: specifier.local.name,
            source,
            isStimulusImport,
            node
          })
        })
      },
    })
  }

  analyzeExportDeclarations() {
    simple(this.ast as any, {
      ExportNamedDeclaration: (node: Acorn.ExportNamedDeclaration) => {
        const { specifiers, declaration } = node

        specifiers.forEach(specifier => {
          this.exportDeclarations.push({
            exportedName: this.extractIdentifier(specifier.exported),
            localName: this.extractIdentifier(specifier.local),
            source: this.extractLiteral(node.source),
            type: "named",
            node
          })
        })

        if (!declaration) return

        if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
          this.exportDeclarations.push({
            exportedName: declaration.id.name,
            localName: declaration.id.name,
            type: "named",
            node
          })
        }

        if (declaration.type === "VariableDeclaration") {
          declaration.declarations.forEach(declaration => {
            this.exportDeclarations.push({
              exportedName: this.extractIdentifier(declaration.id),
              localName: this.extractIdentifier(declaration.id),
              type: "named",
              node
            })
          })
        }
      },

      ExportDefaultDeclaration: (node: Acorn.ExportDefaultDeclaration) => {
        type declarable = Acorn.ClassDeclaration | Acorn.FunctionDeclaration

        const name = this.extractIdentifier(node.declaration)
        const nameFromId = this.extractIdentifier((node.declaration as declarable).id)
        const nameFromAssignment = this.extractIdentifier((node.declaration as Acorn.AssignmentExpression).left)

        this.exportDeclarations.push({
          exportedName: undefined,
          localName: name || nameFromId || nameFromAssignment,
          type: "default",
          node
        })
      },

      ExportAllDeclaration: (node: Acorn.ExportAllDeclaration) => {
        this.exportDeclarations.push({
          exportedName: this.extractIdentifier(node.exported),
          localName: undefined,
          source: this.extractLiteral(node.source),
          type: "namespace",
          node
        })
      },

    })
  }

  analyzeClassDeclarations() {
    simple(this.ast as any, {
      ClassDeclaration: (node: Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration) => {
        const className = this.extractIdentifier(node.id)
        const superClassName = this.extractIdentifier(node.superClass)
        const importDeclaration = this.importDeclarations.find(i => i.localName === superClassName)

        const newSuperClass = superClassName ? {
          className: superClassName,
          superClass: undefined,
          isStimulusDescendant: importDeclaration?.isStimulusImport || false,
          importDeclaration,
        } : undefined

        const superClass = this.classDeclarations.find(i => i.className === superClassName) || newSuperClass

        const baseClass = this.findBaseClass(superClass)
        const isStimulusDescendant = (baseClass?.isStimulusDescendant) || false

        this.classDeclarations.push({
          className,
          superClass,
          isStimulusDescendant
        })
      }
    })
  }

  private extractIdentifier(node: IdentifiableNode): string | undefined {
    return (node && node.type === "Identifier") ? node.name : undefined
  }

  private extractLiteral(node: Acorn.Literal | null | undefined): string | undefined {
    const isLiteral = node && node.type === "Literal"

    if (!isLiteral) return undefined
    if (!node.value) return undefined

    return node.value.toString()
  }

  private isDefaultStimulusImport(importDeclaration: ImportDeclaration | undefined): boolean {
    return importDeclaration ? (importDeclaration.source === "@hotwired/stimulus" && importDeclaration.originalName === "Controller") : false
  }

  private findBaseClass(superClass: ClassDeclaration | undefined): ClassDeclaration | undefined {
    if (!superClass) return undefined

    if (superClass.superClass) {
      return this.findBaseClass(superClass.superClass)
    } else {
      return superClass
    }
  }

  private recursivelyFindImportDeclaration(name: string | undefined): ImportDeclaration | undefined {
    if (!name) return undefined

    const importDeclaration = this.importDeclarations.find(i => i.localName === name)
    const superClass = this.classDeclarations.find(i => i.className === name)

    if (importDeclaration) return importDeclaration

    if (superClass) {
      return this.recursivelyFindImportDeclaration(superClass.superClass?.className)
    }

    return undefined
  }
}

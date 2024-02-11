import { simple } from "acorn-walk"

import * as Acorn from "acorn"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"

import type { AST, TSESTree } from "@typescript-eslint/typescript-estree"
import type { ParserOptions, ImportDeclaration } from "./types"

export class SourceFile {
  readonly path: string
  readonly content: string
  readonly project: Project

  public ast?: AST<ParserOptions>
  public controllerDefinitions: ControllerDefinition[] = []
  public importDeclarations: ImportDeclaration[] = []

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

    const controllerDefinitions = this.project.parser.parseSourceFile(this)
    const controllerDefinition = this.project.parser.parseController(this.content, this.path)

    this.project.controllerDefinitions.push(controllerDefinition)
    this.project.controllerDefinitions.push(...controllerDefinitions)
  }

  analyzeImportDeclarations() {
    simple(this.ast as any, {
      ImportDeclaration: (node: Acorn.ImportDeclaration) => {
        node.specifiers.forEach(specifier => {
          this.importDeclarations.push({
            originalName: (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined,
            localName: specifier.local.name,
            source: (node.source.value || "").toString(),
            node: node as any
          })
        })
      },
    })
  }
}

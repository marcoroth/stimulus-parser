import * as Acorn from "acorn"
import { simple } from "acorn-walk"

import * as ast from "./util/ast"
import * as properties from "./util/properties"
import * as fs from "./util/fs"

import { ParseError } from "./parse_error"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"
import { ClassDeclaration } from "./class_declaration"

import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions, ImportDeclaration, ExportDeclaration } from "./types"

export class SourceFile {
  public content: string
  readonly path: string
  readonly project: Project

  public ast?: AST<ParserOptions>

  public errors: ParseError[] = []
  public importDeclarations: ImportDeclaration[] = []
  public exportDeclarations: ExportDeclaration[] = []
  public classDeclarations: ClassDeclaration[] = []

  get controllerDefinitions(): ControllerDefinition[] {
    return this
      .classDeclarations
      .map(classDeclaration => classDeclaration.controllerDefinition)
      .filter(controllerDefinition => controllerDefinition) as ControllerDefinition[]
  }

  get hasErrors() {
    return this.errors.length > 0
  }

  constructor(path: string, content: string, project: Project) {
    this.path = path
    this.content = content
    this.project = project

    this.parse()
  }

  parse() {
    try {
      this.ast = this.project.parser.parse(this.content, this.path)
    } catch(error: any) {
      this.ast = undefined
      this.errors.push(new ParseError("FAIL", "Error parsing controller", null, error))
    }
  }

  async read() {
    try {
      this.content = await fs.readFile(this.path)
    } catch (error: any) {
      this.content = ""
      this.errors.push(new ParseError("FAIL", "Error reading file", null, error))
    }
  }

  async refresh() {
    this.errors = []
    this.importDeclarations = []
    this.exportDeclarations = []
    this.classDeclarations = []

    await this.read()

    this.parse()
    this.analyze()
  }

  // TODO
  moduleType() {
    return ["esm", "cjs"," umd", "ts"]
  }

  analyze() {
    if (!this.ast) return

    this.analyzeImportDeclarations()
    this.analyzeExportDeclarations()
    this.analyzeClassDeclarations()
    this.analyzeControllers()
    this.analyzeStaticPropertiesExpressions()
  }

  analyzeControllers() {
    this.classDeclarations.forEach((classDeclaration) => classDeclaration.analyze())
  }

  analyzeImportDeclarations() {
    simple(this.ast as any, {
      ImportDeclaration: (node: Acorn.ImportDeclaration) => {
        node.specifiers.forEach(specifier => {
          const originalName = (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined
          const source = ast.extractLiteral(node.source) as string
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
            exportedName: ast.extractIdentifier(specifier.exported),
            localName: ast.extractIdentifier(specifier.local),
            source: ast.extractLiteralAsString(node.source),
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
              exportedName: ast.extractIdentifier(declaration.id),
              localName: ast.extractIdentifier(declaration.id),
              type: "named",
              node
            })
          })
        }
      },

      ExportDefaultDeclaration: (node: Acorn.ExportDefaultDeclaration) => {
        type declarable = Acorn.ClassDeclaration | Acorn.FunctionDeclaration

        const name = ast.extractIdentifier(node.declaration)
        const nameFromId = ast.extractIdentifier((node.declaration as declarable).id)
        const nameFromAssignment = ast.extractIdentifier((node.declaration as Acorn.AssignmentExpression).left)

        this.exportDeclarations.push({
          exportedName: undefined,
          localName: name || nameFromId || nameFromAssignment,
          type: "default",
          node
        })
      },

      ExportAllDeclaration: (node: Acorn.ExportAllDeclaration) => {
        this.exportDeclarations.push({
          exportedName: ast.extractIdentifier(node.exported),
          localName: undefined,
          source: ast.extractLiteralAsString(node.source),
          type: "namespace",
          node
        })
      },

    })
  }

  analyzeClassDeclarations() {
    simple(this.ast as any, {
      ClassDeclaration: (node: Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration) => {
        const className = ast.extractIdentifier(node.id)
        const superClassName = ast.extractIdentifier(node.superClass)
        const importDeclaration = this.importDeclarations.find(i => i.localName === superClassName)
        let superClass = this.classDeclarations.find(i => i.className === superClassName)

        if (!superClass && superClassName) {
          superClass = new ClassDeclaration(superClassName, undefined, this)

          if (importDeclaration) {
            superClass.isStimulusDescendant = importDeclaration.isStimulusImport
            superClass.importDeclaration = importDeclaration
          }
        }

        const classDeclaration = new ClassDeclaration(className, superClass, this, node)

        this.classDeclarations.push(classDeclaration)
      }
    })
  }

  analyzeStaticPropertiesExpressions() {
    simple(this.ast as any, {
      AssignmentExpression: (expression: Acorn.AssignmentExpression): void => {
        if (expression.left.type !== "MemberExpression") return

        const object = expression.left.object
        const property = expression.left.property

        if (property.type !== "Identifier") return
        if (object.type !== "Identifier") return

        const classDeclaration = this.classDeclarations.find(c => c.className === object.name)

        if (!classDeclaration || !classDeclaration.isStimulusDescendant) return

        properties.parseStaticControllerProperties(classDeclaration.controllerDefinition, property, expression.right)
      },
    })
  }
}

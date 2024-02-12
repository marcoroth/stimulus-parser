import * as Acorn from "acorn"
import { simple } from "acorn-walk"

import { ParseError } from "./parse_error"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"
import { ClassDeclaration } from "./class_declaration"
import { readFile } from "./util"

import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions, ImportDeclaration, ExportDeclaration } from "./types"

export class SourceFile {
  public content: string
  readonly path: string
  readonly project: Project

  public ast?: AST<ParserOptions>

  readonly errors: ParseError[] = []
  readonly importDeclarations: ImportDeclaration[] = []
  readonly exportDeclarations: ExportDeclaration[] = []
  readonly classDeclarations: ClassDeclaration[] = []

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
      console.error(`Error while parsing controller in '${this.path}': ${error.message}`)

      this.errors.push(new ParseError("FAIL", "Error parsing controller", null, error))
    }
  }

  async read() {
    this.content = await readFile(this.path)
  }

  async refresh() {
    await this.read()
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
          const source = this.extractLiteral(node.source) as string
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
            source: this.extractLiteralAsString(node.source),
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
          source: this.extractLiteralAsString(node.source),
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

        classDeclaration.parseStaticControllerProperties(property, expression.right)
      },
    })
  }

  public extractIdentifier(node?: Acorn.AnyNode | null): string | undefined {
    if (!node) return undefined
    if (!(node.type === "Identifier" || node.type === "PrivateIdentifier")) return undefined

    return node.name
  }

  public extractLiteral(node?: Acorn.AnyNode | null) {
    const isLiteral = node && node.type === "Literal"

    if (!isLiteral) return undefined
    if (!node.value) return undefined

    return node.value
  }

  public extractLiteralAsString(node?: Acorn.AnyNode | null): string | undefined {
    return this.extractLiteral(node)?.toString()
  }
}

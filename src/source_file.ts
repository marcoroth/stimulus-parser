import path from "path"
import { simple } from "acorn-walk"

import * as ast from "./util/ast"
import * as properties from "./util/properties"
import * as fs from "./util/fs"

import { ParseError } from "./parse_error"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"
import { ClassDeclaration } from "./class_declaration"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"

import type * as Acorn from "acorn"
import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions } from "./types"

export class SourceFile {
  public content?: string
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

  get hasContent() {
    return this.content !== undefined
  }

  get fileExtension() {
    return path.extname(this.path)
  }

  constructor(project: Project, path: string, content?: string) {
    this.project = project
    this.path = path
    this.content = content
  }

  parse() {
    if (this.content === undefined) {
      this.errors.push(new ParseError("FAIL", "File content hasn't been read yet"))
      return
    }

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

  findClass(className: string) {
    return this.classDeclarations.find(klass => klass.className === className)
  }

  analyze() {
    this.parse()

    if (!this.ast) return

    this.analyzeImportDeclarations()
    this.analyzeClassDeclarations()
    this.analyzeExportDeclarations()
    this.analyzeClassExports()
    this.analyzeControllers()
    this.analyzeStaticPropertiesExpressions()
  }

  analyzeControllers() {
    this.classDeclarations.forEach((classDeclaration) => classDeclaration.analyze())
  }

  analyzeImportDeclarations() {
    simple(this.ast as any, {
      ImportDeclaration: node => {
        node.specifiers.forEach(specifier => {
          const original = (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined
          const originalName = (original === "default") ? undefined : original
          const localName = specifier.local.name
          const source = ast.extractLiteral(node.source) as string
          const isStimulusImport = (originalName === "Controller" && source === "@hotwired/stimulus")

          this.importDeclarations.push(
            new ImportDeclaration(this, { originalName, localName, source, isStimulusImport, node })
          )
        })
      },
    })
  }

  analyzeExportDeclarations() {
    const findClass = (specifier?: string) => {
      return this.classDeclarations.find(klass => klass.className == specifier)
    }

    simple(this.ast as any, {
      ExportNamedDeclaration: node => {
        const { specifiers, declaration } = node
        const type = "named"

        specifiers.forEach(specifier => {
          const exportedName = ast.extractIdentifier(specifier.exported)
          const localName = ast.extractIdentifier(specifier.local)
          const source = ast.extractLiteralAsString(node.source)
          const classDeclaration = findClass(localName)
          const isStimulusExport = classDeclaration?.isStimulusDescendant || false

          if (exportedName === "default") {
            this.exportDeclarations.push(
              new ExportDeclaration(this, { localName: (localName === "default" ? undefined : localName), source, isStimulusExport, type: "default", node })
            )
          } else if (localName === "default") {
            this.exportDeclarations.push(
              new ExportDeclaration(this, { exportedName: (exportedName === "default" ? undefined : exportedName), source, isStimulusExport, type: exportedName === "default" ? "default" : "named", node })
            )
          } else {
            this.exportDeclarations.push(
              new ExportDeclaration(this, { exportedName, localName, source, isStimulusExport, type, node })
            )
          }
        })

        if (!declaration) return

        if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
          const exportedName = declaration.id.name
          const localName = declaration.id.name
          const classDeclaration = findClass(localName)
          const isStimulusExport = classDeclaration?.isStimulusDescendant || false

          this.exportDeclarations.push(
            new ExportDeclaration(this, { exportedName, localName, isStimulusExport, type, node })
          )
        }

        if (declaration.type === "VariableDeclaration") {
          declaration.declarations.forEach(declaration => {
            const exportedName = ast.extractIdentifier(declaration.id)
            const localName = ast.extractIdentifier(declaration.id)
            const classDeclaration = findClass(localName)
            const isStimulusExport = classDeclaration?.isStimulusDescendant || false

            this.exportDeclarations.push(
              new ExportDeclaration(this, { exportedName, localName, isStimulusExport, type, node })
            )
          })
        }
      },

      ExportDefaultDeclaration: node => {
        const type = "default"
        const name = ast.extractIdentifier(node.declaration)
        const nameFromId = ast.extractIdentifier((node.declaration as Acorn.ClassDeclaration | Acorn.FunctionDeclaration).id)
        const nameFromAssignment = ast.extractIdentifier((node.declaration as Acorn.AssignmentExpression).left)

        const localName = name || nameFromId || nameFromAssignment
        const classDeclaration = findClass(localName)
        const isStimulusExport = classDeclaration?.isStimulusDescendant || false

        this.exportDeclarations.push(
          new ExportDeclaration(this, { localName, isStimulusExport, type, node })
        )
      },

      ExportAllDeclaration: node => {
        const type = "namespace"
        const exportedName = ast.extractIdentifier(node.exported)
        const source = ast.extractLiteralAsString(node.source)
        const isStimulusExport = false // TODO: detect namespace Stimulus exports

        this.exportDeclarations.push(
          new ExportDeclaration(this, { exportedName, source, isStimulusExport, type, node })
        )
      },

    })
  }

  analyzeClassDeclarations() {
    simple(this.ast as any, {
      ClassDeclaration: node => {
        const className = ast.extractIdentifier(node.id)
        ast.convertClassDeclarationNodeToClassDeclaration(this, className, node)
      },

      VariableDeclaration: node => {
        node.declarations.forEach(declaration => {
          if (declaration.type !== "VariableDeclarator") return
          if (declaration.id.type !== "Identifier") return
          if (!declaration.init || declaration.init.type !== "ClassExpression") return

          const className = ast.extractIdentifier(declaration.id)

          ast.convertClassDeclarationNodeToClassDeclaration(this, className, declaration.init)
        })
      }
    })
  }

  analyzeStaticPropertiesExpressions() {
    simple(this.ast as any, {
      AssignmentExpression: expression => {
        if (expression.left.type !== "MemberExpression") return

        const object = expression.left.object
        const property = expression.left.property

        if (property.type !== "Identifier") return
        if (object.type !== "Identifier") return

        const classDeclaration = this.classDeclarations.find(c => c.className === object.name)

        if (!classDeclaration || !classDeclaration.isStimulusDescendant) return

        properties.parseStaticControllerProperties(classDeclaration.controllerDefinition, property, expression.right)
      },
    })
  }

  analyzeClassExports() {
    this.classDeclarations.forEach(classDeclaration => {
      const exportDeclaration = this.exportDeclarations.find(exportDeclaration => exportDeclaration.localName === classDeclaration.className)

      if (exportDeclaration) {
        classDeclaration.exportDeclaration = exportDeclaration
      }
    })
  }
}

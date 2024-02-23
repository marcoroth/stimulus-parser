import path from "path"

import * as ast from "./util/ast"
import * as properties from "./util/properties"
import * as fs from "./util/fs"

import { ParseError } from "./parse_error"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"
import { ClassDeclaration } from "./class_declaration"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"

import { walk } from "./util/walk"
import { helperPackages } from "./packages"

import type * as Acorn from "acorn"
import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions } from "./types"
import type { ImportDeclarationType } from "./import_declaration"

export class SourceFile {
  public hasSyntaxError: boolean = false
  public isAnalyzed: boolean = false
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

  get isParsed() {
    return !!this.ast
  }

  get isProjectFile() {
    return this.project.projectFiles.includes(this)
  }

  get fileExtension() {
    return path.extname(this.path)
  }

  get defaultExport() {
    return this.exportDeclarations.find(declaration => declaration.type === "default")
  }

  get resolvedClassDeclarations(): ClassDeclaration[] {
    return this.exportDeclarations
      .flatMap(declaration => declaration.resolvedClassDeclaration)
      .filter(dec => dec !== undefined) as ClassDeclaration[]
  }

  get resolvedControllerDefinitions() {
    return this.resolvedClassDeclarations.filter(klass => klass.controllerDefinition)
  }

  get stimulusApplicationImport() {
    return this.importDeclarations.find(declaration =>
      declaration.source === "@hotwired/stimulus" && declaration.originalName === "Application"
    )
  }

  get hasHelperPackage() {
    return this.importDeclarations.some(declaration => helperPackages.includes(declaration.source))
  }

  get hasStimulusApplicationImport() {
    return !!this.importDeclarations.find(declaration => this.project.applicationFile?.path == declaration.resolvedRelativePath)
  }

  get isStimulusControllersIndex() {
    if (this.hasHelperPackage) return true
    if (this.hasStimulusApplicationImport) return true

    return false
  }

  findClass(className: string) {
    return this.classDeclarations.find(klass => klass.className === className)
  }

  findImport(localName: string) {
    return this.importDeclarations.find(declaration => declaration.localName === localName)
  }

  findExport(localName: string) {
    return this.exportDeclarations.find(declaration => declaration.localName === localName)
  }

  constructor(project: Project, path: string, content?: string) {
    this.project = project
    this.path = path
    this.content = content
  }

  async initialize() {
    if (!this.hasContent) {
      await this.read()
    }

    if (!this.isParsed && !this.hasSyntaxError) {
      this.parse()
    }

    this.analyzeImportsAndExports()
  }

  async refresh() {
    this.isAnalyzed = false
    this.hasSyntaxError = false

    this.content = undefined
    this.ast = undefined

    this.errors = []
    this.importDeclarations = []
    this.exportDeclarations = []
    this.classDeclarations = []

    await this.read()

    this.parse()
    this.analyzeImportsAndExports()
    this.analyze()
  }

  async read() {
    this.content = undefined
    this.ast = undefined

    try {
      this.content = await fs.readFile(this.path)
    } catch (error: any) {
      this.errors.push(new ParseError("FAIL", "Error reading file", null, error))
    }
  }

  parse() {
    if (this.isParsed) return

    if (this.content === undefined) {
      this.errors.push(new ParseError("FAIL", "File content hasn't been read yet"))
      return
    }

    this.ast = undefined
    this.hasSyntaxError = false

    try {
      this.ast = this.project.parser.parse(this.content, this.path)
    } catch(error: any) {
      this.hasSyntaxError = true
      this.errors.push(new ParseError("FAIL", `Error parsing controller: ${error.message}`, null, error))
    }
  }

  analyze() {
    if (!this.isParsed) return
    if (this.isAnalyzed) return

    try {
      this.analyzeClassDeclarations()
      this.analyzeClassExports()
      this.analyzeControllers()

      this.isAnalyzed = true
    } catch(error: any) {
      this.errors.push(new ParseError("FAIL", `Error while analyzing file: ${error.message}`, null, error))
    }
  }

  analyzeImportsAndExports() {
    this.analyzeImportDeclarations()
    this.analyzeExportDeclarations()
  }

  analyzeControllers() {
    this.classDeclarations.forEach((classDeclaration) => classDeclaration.analyze())
  }

  analyzeImportDeclarations() {
    if (!this.ast) return

    walk(this.ast, {
      ImportDeclaration: node => {
        node.specifiers.forEach(specifier => {
          const original = (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined
          const originalName = (original === "default") ? undefined : original
          const localName = specifier.local.name
          const source = ast.extractLiteral(node.source) as string
          const isStimulusImport = (originalName === "Controller" && source === "@hotwired/stimulus")

          let type: ImportDeclarationType = "default"

          if (specifier.type === "ImportSpecifier")          type = "named"
          if (specifier.type === "ImportDefaultSpecifier")   type = "default"
          if (specifier.type === "ImportNamespaceSpecifier") type = "namespace"
          if (original === "default")                        type = "default"

          const declaration = new ImportDeclaration(this, { originalName, localName, source, isStimulusImport, node, type })

          this.importDeclarations.push(declaration)
          this.project.registerReferencedNodeModule(declaration)
        })
      },
    })
  }

  analyzeExportDeclarations() {
    if (!this.ast) return

    walk(this.ast, {
      ExportNamedDeclaration: node => {
        const { specifiers, declaration } = node
        const type = "named"

        specifiers.forEach(specifier => {
          const exportedName = ast.extractIdentifier(specifier.exported)
          const localName = ast.extractIdentifier(specifier.local)
          const source = ast.extractLiteralAsString(node.source)
          let exportDeclaration

          if (exportedName === "default") {
            exportDeclaration = new ExportDeclaration(this, { localName: (localName === "default" ? undefined : localName), source, type: "default", node })
          } else if (localName === "default") {
            exportDeclaration = new ExportDeclaration(this, { exportedName: (exportedName === "default" ? undefined : exportedName), source, type: exportedName === "default" ? "default" : "named", node })
          } else {
            exportDeclaration = new ExportDeclaration(this, { exportedName, localName, source, type, node })
          }

          this.exportDeclarations.push(exportDeclaration)
          this.project.registerReferencedNodeModule(exportDeclaration)
        })

        if (!declaration) return

        if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
          const exportedName = declaration.id.name
          const localName = declaration.id.name
          const exportDeclaration = new ExportDeclaration(this, { exportedName, localName, type, node })

          this.exportDeclarations.push(exportDeclaration)
        }

        if (declaration.type === "VariableDeclaration") {
          declaration.declarations.forEach(declaration => {
            const exportedName = ast.extractIdentifier(declaration.id)
            const localName = ast.extractIdentifier(declaration.id)
            const exportDeclaration = new ExportDeclaration(this, { exportedName, localName, type, node })

            this.exportDeclarations.push(exportDeclaration)
          })
        }
      },

      ExportDefaultDeclaration: node => {
        const type = "default"
        const name = ast.extractIdentifier(node.declaration)
        const nameFromId = ast.extractIdentifier((node.declaration as Acorn.ClassDeclaration | Acorn.FunctionDeclaration).id)
        const nameFromAssignment = ast.extractIdentifier((node.declaration as Acorn.AssignmentExpression).left)

        const localName = name || nameFromId || nameFromAssignment
        const exportDeclaration = new ExportDeclaration(this, { localName, type, node })

        this.exportDeclarations.push(exportDeclaration)
      },

      ExportAllDeclaration: node => {
        const type = "namespace"
        const exportedName = ast.extractIdentifier(node.exported)
        const source = ast.extractLiteralAsString(node.source)

        const exportDeclaration = new ExportDeclaration(this, { exportedName, source, type, node })

        this.exportDeclarations.push(exportDeclaration)
        this.project.registerReferencedNodeModule(exportDeclaration)
      },

    })
  }

  analyzeClassDeclarations() {
    walk(this.ast, {
      ClassDeclaration: node => {
        const className = ast.extractIdentifier(node.id)
        const classDeclaration = new ClassDeclaration(this, className, node)

        this.classDeclarations.push(classDeclaration)
      },

      VariableDeclaration: node => {
        node.declarations.forEach(declaration => {
          if (declaration.type !== "VariableDeclarator") return
          if (declaration.id.type !== "Identifier") return
          if (!declaration.init || declaration.init.type !== "ClassExpression") return

          const className = ast.extractIdentifier(declaration.id)
          const classDeclaration = new ClassDeclaration(this, className, declaration.init)

          this.classDeclarations.push(classDeclaration)
        })
      }
    })
  }

  // this function is called from the ClassDeclaration class
  analyzeStaticPropertiesExpressions(controllerDefinition: ControllerDefinition) {
    walk(this.ast, {
      AssignmentExpression: expression => {
        if (expression.left.type !== "MemberExpression") return

        const object = expression.left.object
        const property = expression.left.property

        if (property.type !== "Identifier") return
        if (object.type !== "Identifier") return
        if (object.name !== controllerDefinition.classDeclaration.className) return

        properties.parseStaticControllerProperties(controllerDefinition, property, expression.right)
      },
    })
  }

  // TODO: check if we still need this
  analyzeClassExports() {
    this.classDeclarations.forEach(classDeclaration => {
      const exportDeclaration = this.exportDeclarations.find(exportDeclaration => exportDeclaration.localName === classDeclaration.className)

      if (exportDeclaration) {
        classDeclaration.exportDeclaration = exportDeclaration
      }
    })
  }

  get inspect() {
    return {
      path: this.path,
      hasContent: !!this.content,
      hasErrors: this.hasErrors,
      hasSyntaxError: this.hasSyntaxError,
      hasAst: !!this.ast,
      isParsed: this.isParsed,
      isAnalyzed: this.isAnalyzed,
      imports: this.importDeclarations.map(i => i.inspect),
      exports: this.exportDeclarations.map(e => e.inspect),
      classDeclarations: this.classDeclarations.map(c => c.inspect),
      controllerDefinitions: this.controllerDefinitions.map(c => c.inspect),
      errors: this.errors.map(e => e.inspect),
    }
  }
}

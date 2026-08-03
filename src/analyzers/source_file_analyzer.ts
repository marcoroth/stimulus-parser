import * as ast from "../util/ast"
import * as fs from "../util/fs"

import { ParseError } from "../parse_error"
import { ClassDeclaration } from "../class_declaration"
import { ImportDeclaration } from "../import_declaration"
import { ExportDeclaration } from "../export_declaration"
import { ClassDeclarationAnalyzer } from "./class_declaration_analyzer"

import { walk } from "../util/walk"

import type * as Acorn from "acorn"
import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions } from "@typescript-eslint/types"
import type { SourceFile } from "../source_file"
import type { ImportDeclarationType } from "../import_declaration"

export class SourceFileAnalyzer {
  private readonly sourceFile: SourceFile

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile
  }

  async readContent(): Promise<string | undefined> {
    try {
      return await fs.readFile(this.sourceFile.path)
    } catch (error: any) {
      this.sourceFile.errors.push(new ParseError("FAIL", "Error reading file", null, error))
      return undefined
    }
  }

  private parseContent(content: string): AST<ParserOptions> | undefined {
    this.sourceFile.hasSyntaxError = false

    try {
      return this.sourceFile.project.parser.parse(content, this.sourceFile.path)
    } catch(error: any) {
      this.sourceFile.hasSyntaxError = true
      this.sourceFile.errors.push(new ParseError("FAIL", `Error parsing controller: ${error.message}`, null, error))
      return undefined
    }
  }

  async reparse(): Promise<AST<ParserOptions> | undefined> {
    const content = await this.readContent()
    if (content === undefined) return undefined

    return this.parseContent(content)
  }

  async initialize() {
    const tree = await this.reparse()
    if (!tree) return

    this.analyzeImportDeclarations(tree)
    this.analyzeExportDeclarations(tree)
    this.analyzeClassDeclarations(tree)
    this.analyzeClassExports()
  }

  async analyze() {
    if (this.sourceFile.isAnalyzed) return
    if (this.sourceFile.hasSyntaxError) return

    const tree = await this.reparse()
    if (!tree) return

    try {
      this.analyzeControllers(tree)
      this.sourceFile.isAnalyzed = true
    } catch(error: any) {
      this.sourceFile.errors.push(new ParseError("FAIL", `Error while analyzing file: ${error.message}`, null, error))
    }
  }

  private analyzeControllers(tree: AST<ParserOptions>) {
    this.sourceFile.classDeclarations.forEach((classDeclaration) => {
      const analyzer = new ClassDeclarationAnalyzer(classDeclaration, tree)
      analyzer.analyze()
    })
  }

  private analyzeImportDeclarations(tree: AST<ParserOptions>) {
    walk(tree, {
      ImportDeclaration: node => {
        node.specifiers.forEach(specifier => {
          const original = (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined
          const originalName = (original === "default") ? undefined : original
          const localName = specifier.local.name
          const source = ast.extractLiteral(node.source) as string

          const isStimulusImport = (
            (originalName === "Controller" && ["@hotwired/stimulus", "stimulus"].includes(source)) ||
            (originalName === "BridgeComponent" && ["@hotwired/hotwire-native-bridge", "@hotwired/strada"].includes(source))
          )

          let type: ImportDeclarationType = "default"

          if (specifier.type === "ImportSpecifier")          type = "named"
          if (specifier.type === "ImportDefaultSpecifier")   type = "default"
          if (specifier.type === "ImportNamespaceSpecifier") type = "namespace"
          if (original === "default")                        type = "default"

          const declaration = new ImportDeclaration(this.sourceFile, {
            originalName, localName, source, isStimulusImport, type,
            loc: node.loc,
            sourceLoc: node.source?.loc,
          })

          this.sourceFile.importDeclarations.push(declaration)
          this.sourceFile.project.registerReferencedNodeModule(declaration)
        })
      },
    })
  }

  private analyzeExportDeclarations(tree: AST<ParserOptions>) {
    walk(tree, {
      ExportNamedDeclaration: node => {
        const { specifiers, declaration } = node
        const type = "named"

        specifiers.forEach(specifier => {
          const exportedName = ast.extractIdentifier(specifier.exported)
          const localName = ast.extractIdentifier(specifier.local)
          const source = ast.extractLiteralAsString(node.source)
          let exportDeclaration

          if (exportedName === "default") {
            exportDeclaration = new ExportDeclaration(this.sourceFile, { localName: (localName === "default" ? undefined : localName), source, type: "default", loc: node.loc })
          } else if (localName === "default") {
            exportDeclaration = new ExportDeclaration(this.sourceFile, { exportedName: (exportedName === "default" ? undefined : exportedName), source, type: exportedName === "default" ? "default" : "named", loc: node.loc })
          } else {
            exportDeclaration = new ExportDeclaration(this.sourceFile, { exportedName, localName, source, type, loc: node.loc })
          }

          this.sourceFile.exportDeclarations.push(exportDeclaration)
          this.sourceFile.project.registerReferencedNodeModule(exportDeclaration)
        })

        if (!declaration) return

        if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
          const exportedName = declaration.id.name
          const localName = declaration.id.name
          const exportDeclaration = new ExportDeclaration(this.sourceFile, { exportedName, localName, type, loc: node.loc })

          this.sourceFile.exportDeclarations.push(exportDeclaration)
        }

        if (declaration.type === "VariableDeclaration") {
          declaration.declarations.forEach(declaration => {
            const exportedName = ast.extractIdentifier(declaration.id)
            const localName = ast.extractIdentifier(declaration.id)
            const exportDeclaration = new ExportDeclaration(this.sourceFile, { exportedName, localName, type, loc: node.loc })

            this.sourceFile.exportDeclarations.push(exportDeclaration)
          })
        }
      },

      ExportDefaultDeclaration: node => {
        const type = "default"
        const name = ast.extractIdentifier(node.declaration)
        const nameFromId = ast.extractIdentifier((node.declaration as Acorn.ClassDeclaration | Acorn.FunctionDeclaration).id)
        const nameFromAssignment = ast.extractIdentifier((node.declaration as Acorn.AssignmentExpression).left)

        const localName = name || nameFromId || nameFromAssignment
        const exportDeclaration = new ExportDeclaration(this.sourceFile, { localName, type, loc: node.loc })

        this.sourceFile.exportDeclarations.push(exportDeclaration)
      },

      ExportAllDeclaration: node => {
        const type = "namespace"
        const exportedName = ast.extractIdentifier(node.exported)
        const source = ast.extractLiteralAsString(node.source)

        const exportDeclaration = new ExportDeclaration(this.sourceFile, { exportedName, source, type, loc: node.loc })

        this.sourceFile.exportDeclarations.push(exportDeclaration)
        this.sourceFile.project.registerReferencedNodeModule(exportDeclaration)
      },

    })
  }

  private analyzeClassDeclarations(tree: AST<ParserOptions>) {
    walk(tree, {
      ClassDeclaration: node => {
        const className = ast.extractIdentifier(node.id)
        const superClassName = (node.superClass?.type === "Identifier") ? node.superClass.name : undefined
        const classDeclaration = new ClassDeclaration(this.sourceFile, className, superClassName, node.loc)

        this.sourceFile.classDeclarations.push(classDeclaration)
      },

      ClassExpression: node => {
        const className = ast.extractIdentifier(node.id)
        const superClassName = (node.superClass?.type === "Identifier") ? node.superClass.name : undefined
        const classDeclaration = new ClassDeclaration(this.sourceFile, className, superClassName, node.loc)

        this.sourceFile.classDeclarations.push(classDeclaration)
      },

      VariableDeclaration: node => {
        node.declarations.forEach(declaration => {
          if (declaration.type !== "VariableDeclarator") return
          if (declaration.id.type !== "Identifier") return
          if (!declaration.init || declaration.init.type !== "ClassExpression") return

          const className = ast.extractIdentifier(declaration.id)
          const classNode = declaration.init
          const superClassName = (classNode.superClass?.type === "Identifier") ? classNode.superClass.name : undefined
          const classDeclaration = new ClassDeclaration(this.sourceFile, className, superClassName, classNode.loc)

          this.sourceFile.classDeclarations.push(classDeclaration)
        })
      }
    })
  }

  // TODO: check if we still need this
  private analyzeClassExports() {
    this.sourceFile.classDeclarations.forEach(classDeclaration => {
      const exportDeclaration = this.sourceFile.exportDeclarations.find(exportDeclaration => exportDeclaration.localName === classDeclaration.className)

      if (exportDeclaration) {
        classDeclaration.exportDeclaration = exportDeclaration
      }
    })
  }
}

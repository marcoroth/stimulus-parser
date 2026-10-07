import path from "path"

import { ParseError } from "./parse_error"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"
import { ClassDeclaration } from "./class_declaration"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"

import { helperPackages } from "./packages"

import { SourceFileAnalyzer } from "./analyzers/source_file_analyzer"

export class SourceFile {
  public hasSyntaxError: boolean = false
  public isAnalyzed: boolean = false
  readonly path: string
  readonly project: Project

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

  get exportedControllerDefinitions(): ControllerDefinition[] {
    return this.controllerDefinitions.filter(controllerDefinition => controllerDefinition.classDeclaration.isExported)
  }

  get defaultExportControllerDefinition(): ControllerDefinition | undefined {
    return this.defaultExport?.exportedClassDeclaration?.controllerDefinition
  }

  get hasErrors() {
    return this.errors.length > 0
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

  get hasStimulusApplicationImport() {
    return !!this.stimulusApplicationImport
  }

  get hasResolvedStimulusApplicationFileImport() {
    return !!this.importDeclarations.find(declaration => this.project.applicationFile?.path === declaration.resolvedRelativePath)
  }

  get hasHelperPackage() {
    return this.importDeclarations.some(declaration => helperPackages.includes(declaration.source))
  }

  get isStimulusControllersIndex() {
    if (this.hasHelperPackage) return true
    if (this.hasResolvedStimulusApplicationFileImport) return true

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

  constructor(project: Project, path: string) {
    this.project = project
    this.path = path
  }

  async initialize() {
    const analyzer = new SourceFileAnalyzer(this)
    await analyzer.initialize()
  }

  async analyze() {
    if (this.isAnalyzed) return

    const analyzer = new SourceFileAnalyzer(this)
    await analyzer.analyze()
  }

  async refresh() {
    this.isAnalyzed = false
    this.hasSyntaxError = false

    this.errors = []
    this.importDeclarations = []
    this.exportDeclarations = []
    this.classDeclarations = []

    const analyzer = new SourceFileAnalyzer(this)
    await analyzer.initialize()
    await analyzer.analyze()
  }

  get inspect() {
    return {
      path: this.path,
      hasErrors: this.hasErrors,
      hasSyntaxError: this.hasSyntaxError,
      isAnalyzed: this.isAnalyzed,
      imports: this.importDeclarations.map(i => i.inspect),
      exports: this.exportDeclarations.map(e => e.inspect),
      classDeclarations: this.classDeclarations.map(c => c.inspect),
      controllerDefinitions: this.controllerDefinitions.map(c => c.inspect),
      errors: this.errors.map(e => e.inspect),
    }
  }
}

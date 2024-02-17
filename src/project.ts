import { glob } from "glob"

import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"
import { SourceFile } from "./source_file"
import { NodeModule } from "./node_module"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"

import { detectPackages, analyzePackage } from "./packages"
import { resolvePathWhenFileExists, nestedFolderSort } from "./util/fs"
import { calculateControllerRoots } from "./util/project"

import type { ClassDeclaration } from "./class_declaration"

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"

  static readonly javascriptExtensions = ["js", "mjs", "cjs", "jsx"]
  static readonly typescriptExtensions = ["ts", "mts", "tsx"]

  public detectedNodeModules: Array<NodeModule> = []
  public referencedNodeModules: Set<string> = new Set()
  public projectFiles: Array<SourceFile> = []
  public parser: Parser = new Parser(this)

  constructor(projectPath: string) {
    this.projectPath = projectPath
  }

  relativePath(path: string) {
    return path.replace(`${this.projectPath}/`, "")
  }

  relativeControllerPath(path: string) {
    const controllerRoot = this.controllerRootForPath(path)

    return this.relativePath(path).replace(`${controllerRoot}/`, "")
  }

  possibleControllerPathsForIdentifier(identifier: string): string[] {
    const extensions = Project.javascriptExtensions.concat(Project.typescriptExtensions)

    return this.controllerRoots.flatMap(root => extensions.map(
      extension => `${root}/${ControllerDefinition.controllerPathForIdentifier(identifier, extension)}`
    )).sort(nestedFolderSort)
  }

  async findControllerPathForIdentifier(identifier: string): Promise<string|null> {
    const possiblePaths = this.possibleControllerPathsForIdentifier(identifier)
    const resolvedPaths = await Promise.all(possiblePaths.map(path => resolvePathWhenFileExists(`${this.projectPath}/${path}`)))
    const resolvedPath = resolvedPaths.find(resolvedPath => resolvedPath)

    return resolvedPath ? this.relativePath(resolvedPath) : null
  }

  controllerRootForPath(filePath: string) {
    const relativePath = this.relativePath(filePath)
    const relativeRoots = this.allControllerRoots.map(root => this.relativePath(root)) // TODO: this should be this.controllerRoots

    return relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback
  }

  get controllerDefinitions(): ControllerDefinition[] {
    return this.projectFiles.flatMap(file => file.controllerDefinitions.filter(definition => definition.isStimulusExport)
    )
  }

  get allControllerDefinitions(): ControllerDefinition[] {
    return this.allSourceFiles.flatMap(file => file.controllerDefinitions.filter(definition => definition.isStimulusExport)
    )
  }

  get allSourceFiles() {
    return this.projectFiles.concat(
      ...this.detectedNodeModules.flatMap(module => module.sourceFiles)
    )
  }

  get controllerRoot() {
    return this.controllerRoots[0] || this.controllerRootFallback
  }

  get controllerRoots() {
    const relativePaths = this.projectFiles.map(file => this.relativePath(file.path))
    const roots = calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  get allControllerRoots() {
    const relativePaths = this.allSourceFiles.map(file => this.relativePath(file.path))
    const roots = calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  get referencedNodeModulesLazy() {
    return this.projectFiles
      .flatMap(file => file.importDeclarations)
      .filter(declaration => declaration.isNodeModuleImport)
      .map(declaration => declaration.source)
  }

  registerReferencedNodeModule(declaration: ImportDeclaration|ExportDeclaration) {
    if (!declaration.source) return

    if (declaration instanceof ExportDeclaration && !declaration.isNodeModuleExport) return
    if (declaration instanceof ImportDeclaration && !declaration.isNodeModuleImport) return

    this.referencedNodeModules.add(declaration.source)
  }

  async analyze() {
    this.projectFiles = []
    this.detectedNodeModules = []

    await this.searchProjectFiles()
    await this.analyzeProjectFiles()
    // await this.detectAvailablePackages()
    await this.analyzeReferencedModules()

    this.traceControllers()
  }

  async analyzeReferencedModules() {
    // const referencesModules = this.detectedNodeModules.filter(module => Array.from(this.referencedNodeModules).includes(module.name))
    //
    // await Promise.allSettled(referencesModules.map(module => module.analyze()))

    const referencesModules = Array.from(this.referencedNodeModules).map(async packageName => {
      const nodeModule = await analyzePackage(this, packageName)

      if (nodeModule) {
        await nodeModule.analyze()
      }
    })

    await Promise.allSettled(referencesModules)
  }

  async detectAvailablePackages() {
    await detectPackages(this)
  }

  async analyzeAllDetectedModules() {
    await Promise.allSettled(this.detectedNodeModules.map(module => module.analyze()))
  }

  private async analyzeProjectFiles() {
    await Promise.allSettled(this.projectFiles.map(file => file.refresh()))
  }

  private async searchProjectFiles() {
    const paths = await this.getProjectFilePaths()
    const sourceFilePaths = this.projectFiles.map(file => file.path)

    paths.forEach(path => {
      if (!sourceFilePaths.includes(path)) {
        this.projectFiles.push(new SourceFile(this, path))
      }
    })
  }

  private async getProjectFilePaths(): Promise<string[]> {
    const extensions = Project.javascriptExtensions.concat(Project.typescriptExtensions).join(",")

    return await glob(`${this.projectPath}/**/*controller.{${extensions}}`, {
      ignore: `${this.projectPath}/**/node_modules/**/*`,
    })
  }
}

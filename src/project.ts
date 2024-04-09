import { glob } from "glob"

import { ApplicationFile } from "./application_file"
import { ControllerDefinition } from "./controller_definition"
import { ControllersIndexFile } from "./controllers_index_file"
import { ExportDeclaration } from "./export_declaration"
import { ImportDeclaration } from "./import_declaration"
import { Parser } from "./parser"
import { SourceFile } from "./source_file"

import { analyzeAll, analyzePackage } from "./packages"
import { resolvePathWhenFileExists, nestedFolderSort } from "./util/fs"
import { calculateControllerRoots } from "./util/project"

import type { NodeModule } from "./node_module"
import type { RegisteredController } from "./registered_controller"

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"

  static readonly javascriptExtensions = ["js", "mjs", "cjs", "jsx"]
  static readonly typescriptExtensions = ["ts", "mts", "tsx"]

  public detectedNodeModules: Array<NodeModule> = []
  public referencedNodeModules: Set<string> = new Set()
  public projectFiles: Array<SourceFile> = []
  public _controllerRoots: Set<string> = new Set()
  public parser: Parser = new Parser(this)
  public applicationFile?: ApplicationFile
  public controllersFile?: ControllersIndexFile

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

  guessedRelativeControllerPath(path: string) {
    const controllerRoot = this.guessedControllerRootForPath(path)

    return this.relativePath(path).replace(`${controllerRoot}/`, "")
  }

  possibleControllerPathsForIdentifier(identifier: string): string[] {
    const extensions = Project.javascriptExtensions.concat(Project.typescriptExtensions)

    return this.guessedControllerRoots.flatMap(root => extensions.map(
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
    const relativeRoots = Array.from(this.controllerRoots).map(root => this.relativePath(root))

    return this.relativePath(relativeRoots.find(root => relativePath === root) || relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback)
  }

  guessedControllerRootForPath(filePath: string) {
    const relativePath = this.relativePath(filePath)
    const relativeRoots = this.guessedControllerRoots.map(root => this.relativePath(root))

    return this.relativePath(relativeRoots.find(root => relativePath === root) || relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback)
  }

  get controllerDefinitions(): ControllerDefinition[] {
    return this.projectFiles.flatMap(file => file.exportedControllerDefinitions)
  }

  get allProjectControllerDefinitions(): ControllerDefinition[] {
    return this.projectFiles.flatMap(file => file.controllerDefinitions)
  }

  // TODO: this should be coming from the nodeModules
  get allControllerDefinitions(): ControllerDefinition[] {
    return this.allSourceFiles.flatMap(file => file.controllerDefinitions)
  }

  get allSourceFiles() {
    return this.projectFiles.concat(
      ...this.detectedNodeModules.flatMap(module => module.sourceFiles)
    )
  }

  get controllerRoot() {
    return Array.from(this.controllerRoots)[0] || this.controllerRootFallback
  }

  get controllerRoots() {
    return Array.from(this._controllerRoots)
  }

  get guessedControllerRoots() {
    const controllerFiles = this.allSourceFiles.filter(file => file.controllerDefinitions.length > 0)
    const relativePaths = controllerFiles.map(file => this.relativePath(file.path))
    const roots = calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  get registeredControllers(): RegisteredController[] {
    if (!this.controllersFile) return []

    return this.controllersFile.registeredControllers
  }

  get referencedNodeModulesLazy() {
    return this.projectFiles
      .flatMap(file => file.importDeclarations)
      .filter(declaration => declaration.isNodeModuleImport)
      .map(declaration => declaration.source)
  }

  findProjectFile(path: string) {
    return this.projectFiles.find(file => file.path == path)
  }

  registerReferencedNodeModule(declaration: ImportDeclaration|ExportDeclaration) {
    if (!declaration.source) return

    if (declaration instanceof ExportDeclaration && !declaration.isNodeModuleExport) return
    if (declaration instanceof ImportDeclaration && !declaration.isNodeModuleImport) return

    this.referencedNodeModules.add(declaration.source)
  }

  async initialize() {
    await this.searchProjectFiles()
    await this.analyze()
  }

  async refresh() {
    await this.searchProjectFiles()
    await this.refreshProjectFiles()
    await this.analyze()
  }

  async analyze() {
    await this.initializeProjectFiles()
    await this.analyzeReferencedModules()
    await this.analyzeProjectFiles()
    await this.analyzeStimulusApplicationFile()
    await this.analyzeStimulusControllersIndexFile()
  }

  async reset() {
    this.projectFiles = []
    this.detectedNodeModules = []
    this.referencedNodeModules = new Set()

    await this.initialize()
  }

  async refreshFile(path: string) {
    const projectFile = this.findProjectFile(path)

    if (!projectFile) return

    await projectFile.refresh()

    return projectFile
  }


  async initializeProjectFiles() {
    await Promise.allSettled(this.projectFiles.map(file => file.initialize()))
  }

  private async analyzeProjectFiles() {
    await Promise.allSettled(this.projectFiles.map(file => file.analyze()))
  }

  private async refreshProjectFiles() {
    await Promise.allSettled(this.projectFiles.map(file => file.refresh()))
  }

  async analyzeReferencedModules() {
    const referencesModules = Array.from(this.referencedNodeModules).map(async packageName => {
      const nodeModule = (
        this.detectedNodeModules.find(module => module.name === packageName) || 
        await analyzePackage(this, packageName)
      )

      if (nodeModule && !nodeModule.isAnalyzed) {
        await nodeModule.initialize()
      }
    })

    await Promise.allSettled(referencesModules)
    await Promise.allSettled(this.detectedNodeModules.map(nodeModule => nodeModule.analyze()))
  }

  async detectAvailablePackages() {
    await analyzeAll(this)
  }

  async analyzeAllDetectedModules() {
    const notAnalyzed = this.detectedNodeModules.filter(module => !module.isAnalyzed)

    await Promise.allSettled(notAnalyzed.map(module => module.initialize()))
    await Promise.allSettled(notAnalyzed.map(module => module.analyze()))
  }

  async refreshAllDetectedModules() {
    const analyzed = this.detectedNodeModules.filter(module => module.isAnalyzed)

    await Promise.allSettled(analyzed.map(module => module.refresh()))
  }

  async analyzeStimulusApplicationFile() {
    let applicationFile = this.projectFiles.find(file => !!file.stimulusApplicationImport)

    if (applicationFile) {
      this.applicationFile = new ApplicationFile(this, applicationFile)
    } else {
      // TODO: we probably want to add an error to the project
    }
  }

  async analyzeStimulusControllersIndexFile() {
    let controllersFile = this.projectFiles.find(file => file.isStimulusControllersIndex)

    if (controllersFile) {
      this.controllersFile = new ControllersIndexFile(this, controllersFile)

      await this.controllersFile.analyze()
    } else {
      // TODO: we probably want to add an error to the project
    }
  }

  private async searchProjectFiles() {
    const paths = await this.getProjectFilePaths()

    paths.forEach(path => {
      const file = this.findProjectFile(path)

      if (!file) {
        this.projectFiles.push(new SourceFile(this, path))
      }
    })
  }

  private async getProjectFilePaths(): Promise<string[]> {
    return await glob(`${this.projectPath}/**/*.{${this.extensionsGlob}}`, {
      ignore: `${this.projectPath}/**/node_modules/**/*`,
    })
  }

  get extensionsGlob() {
    return Project.javascriptExtensions.concat(Project.typescriptExtensions).join(",")
  }
}

import path from "path"
import { glob } from "glob"

import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"
import { SourceFile } from "./source_file"
import { NodeModule } from "./node_module"

import { detectPackages } from "./packages"
import { resolvePathWhenFileExists, nestedFolderSort } from "./util/fs"

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"

  static readonly javascriptExtensions = ["js", "mjs", "cjs", "jsx"]
  static readonly typescriptExtensions = ["ts", "mts", "tsx"]

  public detectedNodeModules: Array<NodeModule> = []
  public sourceFiles: Array<SourceFile> = []
  public parser: Parser = new Parser(this)

  static calculateControllerRoots(filenames: string[]) {
    let controllerRoots: string[] = [];

    filenames = filenames.sort(nestedFolderSort)

    const findClosest = (basename: string) => {
      const splits = basename.split("/")

      for (let i = 0; i < splits.length + 1; i++) {
        const possbilePath = splits.slice(0, i).join("/")

        if (controllerRoots.includes(possbilePath) && possbilePath !== basename) {
          return possbilePath
        }
      }
    }

    filenames.forEach(filename => {
      const splits = path.dirname(filename).split("/")
      const controllersIndex = splits.indexOf("controllers")

      if (controllersIndex !== -1) {
        const controllerRoot = splits.slice(0, controllersIndex + 1).join("/")

        if (!controllerRoots.includes(controllerRoot)) {
          controllerRoots.push(controllerRoot)
        }
      } else {
        const controllerRoot = splits.slice(0, splits.length).join("/")
        const found = findClosest(controllerRoot)

        if (found) {
          const index = controllerRoots.indexOf(controllerRoot)
          if (index !== -1) controllerRoots.splice(index, 1)
        } else {
          if (!controllerRoots.includes(controllerRoot)) {
            controllerRoots.push(controllerRoot)
          }
        }
      }
    })

    return controllerRoots.sort(nestedFolderSort)
  }

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

  get controllerDefinitions(): ControllerDefinition[] {
    return this.sourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions.filter(definition => definition.isStimulusExport))
  }

  get allControllerDefinitions(): ControllerDefinition[] {
    return this.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions.filter(definition => definition.isStimulusExport))
  }

  get allSourceFiles() {
    return this.sourceFiles.concat(
      ...this.detectedNodeModules.flatMap(module => module.sourceFiles)
    )
  }

  get controllerRoot() {
    return this.controllerRoots[0] || this.controllerRootFallback
  }

  get controllerRoots() {
    const relativePaths = this.sourceFiles.map(file => this.relativePath(file.path))
    const roots = Project.calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  get allControllerRoots() {
    const relativePaths = this.allSourceFiles.map(file => this.relativePath(file.path))
    const roots = Project.calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  async analyze() {
    this.sourceFiles = []
    this.detectedNodeModules = []

    await this.searchProjectFiles()
    await this.readSourceFiles()
    await detectPackages(this)

    // TODO: in the future we should only analyze node modules that are actually referenced in project source files
    await Promise.allSettled(this.detectedNodeModules.map(module => module.analyze()))
  }

  controllerRootForPath(filePath: string) {
    const relativePath = this.relativePath(filePath)
    const relativeRoots = this.allControllerRoots.map(root => this.relativePath(root)) // TODO: this should be this.controllerRoots

    return relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback
  }

  private async readSourceFiles() {
    await Promise.allSettled(this.sourceFiles.map(file => file.refresh()))
  }

  private async searchProjectFiles() {
    const projectFiles = await this.getProjectFiles()
    const sourceFilePaths = this.sourceFiles.map(file => file.path)

    projectFiles.forEach(path => {
      if (!sourceFilePaths.includes(path)) {
        this.sourceFiles.push(new SourceFile(this, path))
      }
    })
  }

  private async getProjectFiles(): Promise<string[]> {
    return await glob(`${this.projectPath}/**/*controller${this.fileExtensionGlob}`, {
      ignore: `${this.projectPath}/**/node_modules/**/*`,
    })
  }

  get fileExtensionGlob(): string {
    const extensions = Project.javascriptExtensions.concat(Project.typescriptExtensions).join(",")

    return `.{${extensions}}`
  }
}

import path from "path"
import { glob } from "glob"

import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"
import { SourceFile } from "./source_file"

import { readFile, resolvePathWhenFileExists, nestedFolderSort } from "./util/fs"
import { detectPackages } from "./packages"

import type { NodeModule } from "./types"

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
    return this.allControllerDefinitions.filter(definition => definition.isStimulusExport)
  }

  get allControllerDefinitions(): ControllerDefinition[] {
    return this.sourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions)
  }

  get controllerRoot() {
    return this.controllerRoots[0] || this.controllerRootFallback
  }

  get controllerRoots() {
    const relativePaths = this.sourceFiles.map(file => this.relativePath(file.path))
    const roots = Project.calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  async analyze() {
    this.sourceFiles = []
    this.detectedNodeModules = []

    await this.readSourceFiles(await this.getProjectFiles())
    await detectPackages(this)

    this.sourceFiles.map(sourceFile => sourceFile.analyze())
  }

  private controllerRootForPath(path: string) {
    const relativePath = this.relativePath(path)
    const relativeRoots = this.controllerRoots.map(root => this.relativePath(root))

    return relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback
  }

  async readSourceFiles(paths: string[]) {
    await Promise.allSettled(paths.map(path => this.readSourceFile(path)))
  }

  async readSourceFile(path: string) {
    const sourceFile = this.sourceFiles.find(file => file.path === path)

    if (!sourceFile) {
      const content = await readFile(path)
      const sourceFile = new SourceFile(path, content, this)

      this.sourceFiles.push(sourceFile)
    } else {
      await sourceFile.refresh()
    }
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

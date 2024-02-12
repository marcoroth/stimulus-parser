import path from "path"
import { glob } from "glob"

import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"
import { SourceFile } from "./source_file"

import { readFile, resolvePathWhenFileExists, nestedFolderSort } from "./util"
import { detectPackages } from "./packages"

import type { NodeModule } from "./types"

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"
  static readonly javascriptExtensions = ["js", "mjs", "cjs", "jsx"]
  static readonly typescriptExtensions = ["ts", "mts", "tsx"]

  public detectedNodeModules: Array<NodeModule> = []

  get controllerDefinitions(): ControllerDefinition[] {
    return this.sourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions)
  }

  public parser: Parser = new Parser(this)

  private sourceFiles: Array<SourceFile> = []

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
    const promises = possiblePaths.map((path: string) => resolvePathWhenFileExists(`${this.projectPath}/${path}`))
    const possiblePath = Array.from(await Promise.all(promises)).find(promise => promise)

    return (possiblePath) ? this.relativePath(possiblePath) : null
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

    await this.readSourceFiles(await this.getSourceFiles())
    await detectPackages(this)

    this.sourceFiles.map(sourceFile => sourceFile.analyze())
  }

  private controllerRootForPath(path: string) {
    const relativePath = this.relativePath(path)
    const relativeRoots = this.controllerRoots.map(root => this.relativePath(root))

    return relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback
  }

  async readSourceFiles(sourceFiles: string[]) {
    const project = this

    await Promise.allSettled(
      sourceFiles.map(async (path: string) => {
        const content = await readFile(path)
        const sourceFile = new SourceFile(path, content, project)

        this.sourceFiles.push(sourceFile)
      })
    )
  }

  private async getSourceFiles(): Promise<string[]> {
    return await glob(`${this.projectPath}/**/*controller${this.fileExtensionGlob}`, {
      ignore: `${this.projectPath}/**/node_modules/**/*`,
    })
  }

  get fileExtensionGlob(): string {
    const extensions = Project.javascriptExtensions.concat(Project.typescriptExtensions).join(",")

    return `.{${extensions}}`
  }
}

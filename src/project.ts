import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"
import { readFile, resolvePathWhenFileExists, nestedFolderSort } from "./util"
import { detectPackages } from "./packages"
import type { NodeModule } from "./types"

import path from "path"
import { glob } from "glob"

interface ControllerFile {
  filename: string
  content: string
}

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"
  static readonly javascriptEndings = ["js", "mjs", "cjs", "jsx"]
  static readonly typescriptEndings = ["ts", "mts", "tsx"]

  public detectedNodeModules: Array<NodeModule> = []
  public controllerDefinitions: ControllerDefinition[] = []

  private controllerFiles: Array<ControllerFile> = []
  private parser: Parser = new Parser(this)


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
    const endings = Project.javascriptEndings.concat(Project.typescriptEndings)

    return this.controllerRoots.flatMap(root => endings.map(
      ending => `${root}/${ControllerDefinition.controllerPathForIdentifier(identifier, ending)}`
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
    const relativePaths = this.controllerFiles.map(file => this.relativePath(file.filename))
    const roots = Project.calculateControllerRoots(relativePaths).sort(nestedFolderSort)

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  async analyze() {
    this.controllerFiles = []
    this.controllerDefinitions = []

    await this.readControllerFiles(await this.getControllerFiles())
    await detectPackages(this)

    this.controllerFiles.forEach((file: ControllerFile) => {
      this.controllerDefinitions.push(this.parser.parseController(file.content, file.filename))
    })
  }

  private controllerRootForPath(path: string) {
    const relativePath = this.relativePath(path)
    const relativeRoots = this.controllerRoots.map(root => this.relativePath(root))

    return relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback
  }

  async readControllerFiles(controllerFiles: string[]) {
    await Promise.allSettled(
      controllerFiles.map(async (filename: string) => {
        const content = await readFile(filename)

        this.controllerFiles.push({ filename, content })
      })
    )
  }

  private async getControllerFiles(): Promise<string[]> {
    return await glob(`${this.projectPath}/**/*controller${this.fileEndingsGlob}`, {
      ignore: `${this.projectPath}/**/node_modules/**/*`,
    })
  }

  get fileEndingsGlob(): string {
    const extensions = Project.javascriptEndings.concat(Project.typescriptEndings).join(",")

    return `.{${extensions}}`
  }
}

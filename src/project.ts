import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"

import { promises as fs } from "fs"
import { glob } from "glob"

const fileExists = (path: string) => {
  return new Promise<string|null>((resolve, reject) =>
    fs.stat(path).then(() => resolve(path)).catch(() => reject())
  )
}

interface ControllerFile {
  filename: string
  content: string
}

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"
  static readonly javascriptEndings = ["js", "mjs", "cjs", "jsx"]
  static readonly typescriptEndings = ["ts", "mts", "tsx"]

  public controllerDefinitions: ControllerDefinition[] = []

  private controllerFiles: Array<ControllerFile> = []
  private parser: Parser = new Parser(this)

  static calculateControllerRoots(filenames: string[]) {
    const controllerRoots: string[] = [];

    filenames.forEach(filename => {
      const splits = filename.split("/")
      const controllersIndex = splits.indexOf("controllers")

      if (controllersIndex !== -1) {
        const controllerRoot = splits.slice(0, controllersIndex + 1).join("/")

        if (!controllerRoots.includes(controllerRoot)) {
          controllerRoots.push(controllerRoot)
        }
      }
    })

    return controllerRoots.sort();
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
    ))
  }

  async findControllerPathForIdentifier(identifier: string): Promise<string|null> {
    const possiblePaths = this.possibleControllerPathsForIdentifier(identifier)
    const promises = possiblePaths.map((path: string) => fileExists(`${this.projectPath}/${path}`))
    const possiblePath = await Promise.any(promises).catch(() => null)

    return (possiblePath) ? this.relativePath(possiblePath) : null
  }

  get controllerRoot() {
    return this.controllerRoots[0] || this.controllerRootFallback
  }

  get controllerRoots() {
    const roots = Project.calculateControllerRoots(
      this.controllerFiles.map(file => this.relativePath(file.filename))
    )

    return (roots.length > 0) ? roots : [this.controllerRootFallback]
  }

  async analyze() {
    this.controllerFiles = []
    this.controllerDefinitions = []

    await this.readControllerFiles()

    this.controllerFiles.forEach((file: ControllerFile) => {
      this.controllerDefinitions.push(this.parser.parseController(file.content, file.filename))
    })
  }

  private controllerRootForPath(path: string) {
    const relativePath = this.relativePath(path)
    const relativeRoots = this.controllerRoots.map(root => this.relativePath(root))

    return relativeRoots.find(root => relativePath.startsWith(root)) || this.controllerRootFallback
  }

  private async readControllerFiles() {
    const endings = `${Project.javascriptEndings.join(",")},${Project.typescriptEndings.join(",")}`

    const controllerFiles = await glob(`${this.projectPath}/**/*_controller.{${endings}}`, {
      ignore: `${this.projectPath}/node_modules/**/*`,
    })

    await Promise.allSettled(
      controllerFiles.map(async (filename: string) => {
        const content = await fs.readFile(filename, "utf8")

        this.controllerFiles.push({ filename, content })
      })
    )
  }
}

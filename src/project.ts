import { ControllerDefinition } from "./controller_definition"
import { Parser } from "./parser"

import { promises as fs } from "fs"
import { glob } from "glob"

interface ControllerFile {
  filename: string
  content: string
}

export class Project {
  readonly projectPath: string
  readonly controllerRootFallback = "app/javascript/controllers"

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

  get controllerRoot() {
    return this.controllerRoots[0] || this.controllerRootFallback
  }

  get controllerRoots() {
    return Project.calculateControllerRoots(
      this.controllerFiles.map(file => this.relativePath(file.filename))
    )
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
    const controllerFiles = await glob(`${this.projectPath}/**/*_controller.js`, {
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

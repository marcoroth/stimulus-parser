import path from "path"

import { Project } from "./project"
import { ParseError } from "./parse_error"

import { identifierForContextKey } from "@hotwired/stimulus-webpack-helpers"

type ValueDefinitionValue = Array<any> | boolean | number | object | string | undefined

type ValueDefinition = {
  type: string
  default: ValueDefinitionValue
}

type ParentController = {
  controllerFile?: string
  constant: string
  identifier?: string
  definition?: ControllerDefinition
  package?: string
  parent?: ParentController
  type: "default" | "application" | "package" | "import" | "unknown"
}

export const defaultValuesForType = {
  Array: [],
  Boolean: false,
  Number: 0,
  Object: {},
  String: "",
} as { [key: string]: ValueDefinitionValue }

export class ControllerDefinition {
  readonly path: string
  readonly project: Project
  parent?: ParentController

  methods: Array<string> = []
  targets: Array<string> = []
  classes: Array<string> = []
  values: { [key: string]: ValueDefinition } = {}

  readonly errors: ParseError[] = []
  get hasErrors() {
    return this.errors.length > 0
  }

  static controllerPathForIdentifier(identifier: string, fileending: string = "js"): string {
    const path = identifier.replace(/--/g, "/").replace(/-/g, "_")

    return `${path}_controller.${fileending}`
  }

  constructor(project: Project, path: string) {
    this.project = project
    this.path = path
  }

  get controllerPath() {
    return this.project.relativeControllerPath(this.path)
  }

  get identifier() {
    const folder = path.dirname(this.controllerPath)
    const extension = path.extname(this.controllerPath)
    const file = path.basename(this.controllerPath)
    const filename = path.basename(this.controllerPath, extension)

    if (file === `controller${extension}`) {
      return identifierForContextKey(`${folder}_${file}${extension}`) || ""
    } else if (!filename.endsWith("controller")) {
      return identifierForContextKey(`${folder}/${filename}_controller${extension}`) || ""
    } else {
      return identifierForContextKey(this.controllerPath) || ""
    }
  }

  get isNamespaced() {
    return this.identifier.includes("--")
  }

  get namespace() {
    const splits = this.identifier.split("--")

    return splits.slice(0, splits.length - 1).join("--")
  }

  get type() {
    const splits = this.path.split(".")
    const ending = splits[splits.length - 1]

    if (Project.javascriptEndings.includes(ending)) return "javascript"
    if (Project.typescriptEndings.includes(ending)) return "typescript"

    return "javascript"
  }
}

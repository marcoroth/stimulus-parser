import { Project } from "./project"
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

  parseError?: string

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
    return identifierForContextKey(this.controllerPath) || ""
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

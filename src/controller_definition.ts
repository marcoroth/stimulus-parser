import { Project } from "./project"
import { ParseError } from "./parse_error"

import { identifierForContextKey } from "@hotwired/stimulus-webpack-helpers"
import { MethodDefinition, ValueDefinition, ClassDefinition, TargetDefinition } from "./controller_property_definition"

type ParentController = {
  controllerFile?: string
  constant: string
  identifier?: string
  definition?: ControllerDefinition
  package?: string
  parent?: ParentController
  type: "default" | "application" | "package" | "import" | "unknown"
}


export class ControllerDefinition {
  readonly path: string
  readonly project: Project
  parent?: ParentController

  isTyped: boolean = false
  anyDecorator: boolean = false

  readonly _methods: Array<MethodDefinition> = []
  readonly _targets: Array<TargetDefinition> = []
  readonly _classes: Array<ClassDefinition> = []
  readonly _values: { [key: string]: ValueDefinition } = {}

  readonly errors: ParseError[] = []

  static controllerPathForIdentifier(identifier: string, fileending: string = "js"): string {
    const path = identifier.replace(/--/g, "/").replace(/-/g, "_")

    return `${path}_controller.${fileending}`
  }

  constructor(project: Project, path: string) {
    this.project = project
    this.path = path
  }

  get hasErrors() {
    return this.errors.length > 0
  }

  get methods() {
    return this._methods.map((method) => method.name)
  }

  get targets() {
    return this._targets.map((method) => method.name)
  }

  get classes() {
    return this._classes.map((method) => method.name)
  }

  get values() {
    return Object.fromEntries(Object.entries(this._values).map(([key, def]) => [key, def.valueDef]))
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

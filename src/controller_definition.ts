import { Project } from "./project"
import { ParseError } from "./parse_error"

import { identifierForContextKey } from "@hotwired/stimulus-webpack-helpers"
import { SourceLocation } from "acorn"

type ParentController = {
  controllerFile?: string
  constant: string
  identifier?: string
  definition?: ControllerDefinition
  package?: string
  parent?: ParentController
  type: "default" | "application" | "package" | "import" | "unknown"
}

export class Definition {
  constructor(
    public readonly name: string,
    public readonly loc?: SourceLocation,
    public readonly definitionType: "decorator" | "static" = "decorator",
  ) {}
}

type ValueDefinitionValue = Array<any> | boolean | number | object | string | undefined
export class ValueDefinition extends Definition {
  constructor(
    name: string,
    public readonly valueDef: { type: string; default: ValueDefinitionValue },
    loc?: SourceLocation,
    definitionType: "decorator" | "static" = "decorator",
  ) {
    super(name, loc, definitionType)
  }

  public static defaultValuesForType = {
    Array: [],
    Boolean: false,
    Number: 0,
    Object: {},
    String: "",
  } as { [key: string]: ValueDefinitionValue }
}

export class ControllerDefinition {
  readonly path: string
  readonly project: Project
  parent?: ParentController

  isTyped: boolean = false
  anyDecorator: boolean = false

  readonly _methods: Array<Definition> = []
  readonly _targets: Array<Definition> = []
  readonly _classes: Array<Definition> = []
  readonly _values: { [key: string]: ValueDefinition } = {}

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

  // getters for converting internal representations to not break the API
  get methods() {
    return this._methods.map((method) => method.name)
  }

  // getters for converting internal representations to not break the API
  get targets() {
    return this._targets.map((method) => method.name)
  }

  // getters for converting internal representations to not break the API
  get classes() {
    return this._classes.map((method) => method.name)
  }

  // getters for converting internal representations to not break the API
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

import path from "path"

import { identifierForContextKey } from "@hotwired/stimulus-webpack-helpers"

import { Project } from "./project"
import { ClassDeclaration } from "./class_declaration"
import { ParseError } from "./parse_error"

import { MethodDefinition, ValueDefinition, ClassDefinition, TargetDefinition } from "./controller_property_definition"

export class ControllerDefinition {
  readonly path: string
  readonly project: Project
  readonly classDeclaration?: ClassDeclaration

  isTyped: boolean = false
  anyDecorator: boolean = false

  readonly errors: ParseError[] = []
  readonly _methods: Array<MethodDefinition> = []
  readonly _targets: Array<TargetDefinition> = []
  readonly _classes: Array<ClassDefinition> = []
  readonly _values: { [key: string]: ValueDefinition } = {}

  static controllerPathForIdentifier(identifier: string, fileExtension: string = "js"): string {
    const path = identifier.replace(/--/g, "/").replace(/-/g, "_")

    return `${path}_controller.${fileExtension}`
  }

  constructor(project: Project, path: string, classDeclaration?: ClassDeclaration) {
    this.project = project
    this.path = path
    this.classDeclaration = classDeclaration
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
    return Object.fromEntries(Object.entries(this._values).map(([key, def]) => [key, def.definition]))
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
    const extension = splits[splits.length - 1]

    if (Project.javascriptExtensions.includes(extension)) return "javascript"
    if (Project.typescriptExtensions.includes(extension)) return "typescript"

    return "javascript"
  }
}

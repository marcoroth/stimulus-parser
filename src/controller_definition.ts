import path from "path"

import { identifierForContextKey } from "@hotwired/stimulus-webpack-helpers"

import { Project } from "./project"
import { ClassDeclaration } from "./class_declaration"
import { ParseError } from "./parse_error"
import { MethodDefinition, ValueDefinition, ClassDefinition, TargetDefinition } from "./controller_property_definition"

import { dasherize, uncapitalize, camelize } from "./util/string"

import type { RegisteredController } from "./registered_controller"

export class ControllerDefinition {
  readonly project: Project
  readonly classDeclaration: ClassDeclaration

  public isTyped: boolean = false
  public anyDecorator: boolean = false

  readonly errors: ParseError[] = []
  readonly methodDefinitions: Array<MethodDefinition> = []
  readonly targetDefinitions: Array<TargetDefinition> = []
  readonly classDefinitions: Array<ClassDefinition> = []
  readonly valueDefinitions: { [key: string]: ValueDefinition } = {}

  static controllerPathForIdentifier(identifier: string, fileExtension: string = "js"): string {
    const path = identifier.replace(/--/g, "/").replace(/-/g, "_")

    return `${path}_controller.${fileExtension}`
  }

  constructor(project: Project, classDeclaration: ClassDeclaration) {
    this.project = project
    this.classDeclaration = classDeclaration
  }

  get hasErrors() {
    return this.errors.length > 0
  }

  get sourceFile() {
    return this.classDeclaration.sourceFile
  }

  get path() {
    return this.sourceFile.path
  }

  // Actions

  get actions(): MethodDefinition[] {
    return this.classDeclaration.ancestors.flatMap(klass =>
      klass.controllerDefinition?.methodDefinitions || []
    )
  }

  get actionNames(): string[] {
    return this.actions.map(action => action.name)
  }

  get localActions(): MethodDefinition[] {
    return this.methodDefinitions
  }

  get localActionNames(): string[] {
    return this.localActions.map(method => method.name)
  }

  // Targets

  get targets(): TargetDefinition[] {
    return this.classDeclaration.ancestors.flatMap(klass =>
      klass.controllerDefinition?.targetDefinitions || []
    )
  }

  get targetNames(): string[] {
    return this.targets.map(target => target.name)
  }

  get localTargets(): TargetDefinition[] {
    return this.targetDefinitions
  }

  get localTargetNames(): string[] {
    return this.localTargets.map(target => target.name)
  }

  // Classes

  get classes(): ClassDefinition[] {
    return this.classDeclaration.ancestors.flatMap(klass =>
      klass.controllerDefinition?.classDefinitions || []
    )
  }

  get classNames(): string[] {
    return this.classes.map(klass => klass.name)
  }

  get localClasses(): ClassDefinition[] {
    return this.classDefinitions
  }

  get localClassNames(): string[] {
    return this.localClasses.map(klass => klass.name)
  }

  // Values

  get values() {
    return Object.fromEntries(this.classDeclaration.ancestors.flatMap(klass =>
      Object.entries((klass.controllerDefinition?.valueDefinitions || {})).map(([key, def]) => [key, def.definition])
    ))
  }

  get localValues() {
    return Object.fromEntries(Object.entries(this.valueDefinitions).map(([key, def]) => [key, def.definition]))
  }

  get controllerRoot(): string {
    return this.project.controllerRootForPath(this.path)
  }

  get controllerPath() {
    return this.project.relativeControllerPath(this.path)
  }

  get guessedControllerPath() {
    return this.project.guessedRelativeControllerPath(this.path)
  }

  get isExported(): boolean {
    return this.classDeclaration.isExported
  }

  get registeredControllers(): RegisteredController[] {
    return this.project.registeredControllers.filter(controller => controller.controllerDefinition === this)
  }

  get registeredIdentifiers(): string[] {
    return this.registeredControllers.map(controller => controller.identifier)
  }

  get guessedIdentifier() {
    const className = this.classDeclaration?.className
    const hasMoreThanOneController = this.classDeclaration?.sourceFile.classDeclarations.filter(klass => klass.isStimulusDescendant).length > 1
    const isProjectFile = this.path.includes("node_modules")

    if (className && ((isProjectFile && hasMoreThanOneController) || (!isProjectFile))) {
      return dasherize(uncapitalize(className.replace("Controller", "")))
    }

    const folder = path.dirname(this.controllerPath)
    const extension = path.extname(this.controllerPath)
    const file = path.basename(this.controllerPath)
    const filename = path.basename(this.controllerPath, extension)

    const toControllerIdentifier = (file: string): string => {
      const identifier = dasherize(camelize(path.basename(path.dirname(file))))

      if (["dist", "src", "index", "out"].includes(identifier)) {
        return toControllerIdentifier(path.dirname(file))
      }

      return identifier
    }

    if (file === `controller${extension}`) {
      return identifierForContextKey(`${folder}_${file}${extension}`) || ""
    } else if (this.path.includes("node_modules")) {
      const identifier = dasherize(camelize(path.basename(this.path, path.extname(this.path))))

      return (identifier === "index") ? toControllerIdentifier(path.dirname(this.path)) : identifier
    } else if (!filename.endsWith("controller")) {
      return identifierForContextKey(`${folder}/${filename}_controller${extension}`) || ""
    } else {
      return identifierForContextKey(this.guessedControllerPath) || ""
    }
  }

  get isNamespaced(): boolean {
    return this.guessedIdentifier.includes("--")
  }

  get namespace() {
    const splits = this.guessedIdentifier.split("--")

    return splits.slice(0, splits.length - 1).join("--")
  }

  get type() {
    const splits = this.path.split(".")
    const extension = splits[splits.length - 1]

    if (Project.javascriptExtensions.includes(extension)) return "javascript"
    if (Project.typescriptExtensions.includes(extension)) return "typescript"

    return "javascript"
  }

  addTargetDefinition(targetDefinition: TargetDefinition): void {
    if (this.targetNames.includes(targetDefinition.name)) {
      this.errors.push(new ParseError("LINT", `Duplicate definition of Stimulus target "${targetDefinition.name}"`, targetDefinition.loc))
    }

    this.targetDefinitions.push(targetDefinition)
  }

  addClassDefinition(classDefinition: ClassDefinition) {
    if (this.classNames.includes(classDefinition.name)) {
      this.errors.push(new ParseError("LINT", `Duplicate definition of Stimulus class "${classDefinition.name}"`, classDefinition.loc))
    }

    this.classDefinitions.push(classDefinition)
  }

  addValueDefinition(valueDefinition: ValueDefinition) {
    if (this.values[valueDefinition.name]) {
      const error = new ParseError("LINT", `Duplicate definition of Stimulus value "${valueDefinition.name}"`, valueDefinition.loc)

      this.errors.push(error)
    } else {
      this.valueDefinitions[valueDefinition.name] = valueDefinition
    }
  }

  get inspect() {
    return {
      guessedIdentifier: this.guessedIdentifier,
      targets: this.targetNames,
      values: this.valueDefinitions,
      classes: this.classNames,
      actions: this.actionNames,
    }
  }
}

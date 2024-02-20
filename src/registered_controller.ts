import { ControllerDefinition} from "./controller_definition"

import type { ControllerLoadMode } from "./types"

export class RegisteredController {
  public readonly controllerDefinition: ControllerDefinition
  public readonly identifier: string
  public readonly loadMode: ControllerLoadMode

  constructor(identifier: string, controllerDefinition: ControllerDefinition, loadMode: ControllerLoadMode){
    this.identifier = identifier
    this.controllerDefinition = controllerDefinition
    this.loadMode = loadMode
  }

  get path() {
    return this.sourceFile.path
  }

  get sourceFile() {
    return this.controllerDefinition.sourceFile
  }

  get classDeclaration() {
    return this.controllerDefinition.classDeclaration
  }

  get isNamespaced(): boolean {
    return this.identifier.includes("--") || false
  }

  get namespace() {
    const splits = this.identifier.split("--")

    return splits.slice(0, splits.length - 1).join("--")
  }
}

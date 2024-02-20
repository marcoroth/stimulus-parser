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
}

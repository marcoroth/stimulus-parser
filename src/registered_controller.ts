import { ControllerDefinition} from "./controller_definition"

export class RegisteredController {
  public readonly controllerDefinition: ControllerDefinition
  public readonly identifier: string

  constructor(identifier: string, controllerDefinition: ControllerDefinition){
    this.identifier = identifier
    this.controllerDefinition = controllerDefinition
  }
}

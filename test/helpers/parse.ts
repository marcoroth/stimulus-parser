import { setupProject } from "./setup"

import { SourceFile } from "../../src/source_file"
import type { ControllerDefinition } from "../../src/controller_definition"

export function parseController(code: string, filename: string, controllerName?: string): ControllerDefinition {
  const sourceFile = new SourceFile(setupProject(), filename, code)
  sourceFile.initialize()
  sourceFile.analyze()

  sourceFile.classDeclarations.forEach(klass => klass.analyze())

  if (controllerName) {
    return sourceFile.findClass(controllerName)?.controllerDefinition
  } else {
    return sourceFile.classDeclarations[0]?.controllerDefinition
  }
}

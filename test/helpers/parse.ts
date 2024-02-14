import { setupProject } from "./setup"

import { SourceFile } from "../../src/source_file"
import type { ControllerDefinition } from "../../src/controller_definition"

export function parseController(code: string, filename: string): ControllerDefinition {
  const sourceFile = new SourceFile(setupProject(), filename, code)
  sourceFile.analyze()

  return sourceFile.controllerDefinitions[0]
}

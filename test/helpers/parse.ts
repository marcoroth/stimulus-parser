import { setupProject } from "./setup"
import { createTestSourceFile } from "./temp"

import type { ControllerDefinition } from "../../src/controller_definition"

export async function parseController(code: string, filename: string, controllerName?: string): Promise<ControllerDefinition> {
  const project = setupProject()
  const sourceFile = createTestSourceFile(project, filename, code)

  await sourceFile.initialize()
  await sourceFile.analyze()

  if (controllerName) {
    return sourceFile.findClass(controllerName)?.controllerDefinition
  } else {
    return sourceFile.classDeclarations[0]?.controllerDefinition
  }
}

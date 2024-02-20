import path from "path"
import dedent from "dedent"
import { beforeEach } from "vitest"
import { Parser, Project, SourceFile, RegisteredController } from "../../src"

export const setupProject = (fixture?: string): Project => {
  let projectPath = process.cwd()

  if (fixture) {
    projectPath = path.join(process.cwd(), "test", "fixtures", fixture)
  }

  return new Project(projectPath)
}

export const setupParser = (): Parser => {
  const project = setupProject()
  let parser = new Parser(project)

  beforeEach(() => {
    parser = new Parser(project)
  })

  return parser
}

const basicController = dedent`
  import { Controller } from "@hotwired/stimulus"

  export default class extends Controller {}
`

export const sourceFileFor = async (project: Project, path: string, code: string = basicController) => {
  const sourceFile = new SourceFile(project, path, code)
  project.projectFiles.push(sourceFile)

  await sourceFile.initialize()
  sourceFile.analyze()

  return sourceFile
}

export const classDeclarationFor = async (project: Project, path: string) => {

  return (await sourceFileFor(project, path, basicController)).classDeclarations[0]
}

export const controllerDefinitionFor = async (project: Project, path: string, identifier?: string) => {
  const classDeclaration = await classDeclarationFor(project, path)

  if (identifier) {
    classDeclaration.sourceFile.project.controllersFile?.registeredControllers.push(
      new RegisteredController(
        identifier,
        classDeclaration.controllerDefinition,
        "load"
      )
    )
  }

  return classDeclaration.controllerDefinition
}

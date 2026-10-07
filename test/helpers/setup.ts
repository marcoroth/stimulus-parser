import path from "path"
import nodeFs from "fs"
import dedent from "dedent"
import { beforeEach } from "vitest"
import { Parser, Project, RegisteredController } from "../../src"
import { createTestSourceFile, getTempDir } from "./temp"

let tempProjectCounter = 0

/**
 * Sets up a project for testing.
 *
 * Without a fixture: creates a fresh temp directory (for tests that write their own files).
 * With a fixture and writable=false (default): uses the fixture directory directly (for read-only system tests).
 * With a fixture and writable=true: creates a temp directory with symlinks to fixture's node_modules/package.json (for tests that need fixture dependencies AND write their own files).
 *
 */
export const setupProject = (fixture?: string, { writable = false }: { writable?: boolean } = {}): Project => {
  if (!fixture) {
    const projectDir = path.join(getTempDir(), `project-${++tempProjectCounter}`)
    nodeFs.mkdirSync(projectDir, { recursive: true })

    return new Project(projectDir)
  }

  const fixturePath = path.join(process.cwd(), "test", "fixtures", fixture)

  if (!writable) {
    return new Project(fixturePath)
  }

  const projectDir = path.join(getTempDir(), `project-${fixture.replace(/\//g, "-")}-${++tempProjectCounter}`)
  nodeFs.mkdirSync(projectDir, { recursive: true })

  for (const entry of ["node_modules", "package.json"]) {
    const src = path.join(fixturePath, entry)
    const dest = path.join(projectDir, entry)

    if (nodeFs.existsSync(src) && !nodeFs.existsSync(dest)) {
      nodeFs.symlinkSync(src, dest)
    }
  }

  return new Project(projectDir)
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

export const sourceFileFor = async (project: Project, filename: string, code: string = basicController) => {
  const sourceFile = createTestSourceFile(project, filename, code)
  project.projectFiles.push(sourceFile)

  await sourceFile.initialize()
  await sourceFile.analyze()

  return sourceFile
}

export const classDeclarationFor = async (project: Project, filename: string) => {
  return (await sourceFileFor(project, filename, basicController)).classDeclarations[0]
}

export const controllerDefinitionFor = async (project: Project, filename: string, identifier?: string) => {
  const classDeclaration = await classDeclarationFor(project, filename)

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

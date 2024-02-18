import path from "path"
import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

import { ClassDeclaration, StimulusControllerClassDeclaration } from "../../src/class_declaration"
import { SourceFile } from "../../src/source_file"

let project = setupProject("packages/stimulus-dropdown")

describe("@hotwired/stimulus Controller", () => {
  test("parse parent", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {}
    `

    const sourceFile = new SourceFile(project, "parent_controller.js", code)

    project.projectFiles.push(sourceFile)

    await project.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]

    expect(sourceFile.classDeclarations.length).toEqual(1)
    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual("Controller")
    expect(classDeclaration.superClass.importDeclaration.localName).toEqual("Controller")
    expect(classDeclaration.superClass.importDeclaration.originalName).toEqual("Controller")
    expect(classDeclaration.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
    expect(classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(true)
    expect(classDeclaration.superClass.superClass).toEqual(undefined)
  })

  test("parse parent with import alias", async () => {
    const code = dedent`
      import { Controller as StimulusController } from "@hotwired/stimulus"

      export default class extends StimulusController {}
    `

    const sourceFile = new SourceFile(project, "parent_controller.js", code)
    project.projectFiles.push(sourceFile)

    await project.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]

    expect(sourceFile.classDeclarations.length).toEqual(1)
    expect(classDeclaration.isStimulusDescendant).toEqual(true)
    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual("StimulusController")
    expect(classDeclaration.superClass.importDeclaration.localName).toEqual("StimulusController")
    expect(classDeclaration.superClass.importDeclaration.originalName).toEqual("Controller")
    expect(classDeclaration.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
    expect(classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(true)
    expect(classDeclaration.superClass.superClass).toEqual(undefined)
  })
})

describe("with controller in same file", () => {
  test("parse parent", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class AbstractController extends Controller {}

      export default class extends AbstractController {}
    `

    const sourceFile = new SourceFile(project, "parent_controller.js", code)
    project.projectFiles.push(sourceFile)

    await project.analyze()

    const abstractController = sourceFile.classDeclarations[0]
    const exportController = sourceFile.classDeclarations[1]

    expect(sourceFile.classDeclarations.length).toEqual(2)

    expect(abstractController.isStimulusDescendant).toEqual(true)
    expect(abstractController.className).toEqual("AbstractController")
    expect(abstractController.superClass.className).toEqual("Controller")
    expect(abstractController.superClass.importDeclaration.localName).toEqual("Controller")
    expect(abstractController.superClass.importDeclaration.originalName).toEqual("Controller")
    expect(abstractController.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
    expect(abstractController.superClass.importDeclaration.isStimulusImport).toEqual(true)
    expect(abstractController.superClass.superClass).toEqual(undefined)

    expect(exportController.isStimulusDescendant).toEqual(true)
    expect(exportController.className).toEqual(undefined)
    expect(exportController.superClass.className).toEqual("AbstractController")
    expect(exportController.superClass.importDeclaration).toEqual(undefined)
    expect(exportController.superClass).toEqual(abstractController)
  })
})

describe("with controller from other file", () => {
  test("parse parent", async () => {
    const applicationCode = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {}
    `

    const helloCode = dedent`
      import ApplicationController from "./application_controller"

      export default class extends ApplicationController {}
    `

    const applicationFile = new SourceFile(project, path.join(project.projectPath, "application_controller.js"), applicationCode)
    const helloFile = new SourceFile(project, path.join(project.projectPath, "parent_controller.js"), helloCode)

    project.projectFiles.push(applicationFile)
    project.projectFiles.push(helloFile)

    await project.analyze()

    const applicationController = applicationFile.classDeclarations[0]
    const helloController = helloFile.classDeclarations[0]

    expect(helloFile.classDeclarations.length).toEqual(1)

    expect(helloController.isStimulusDescendant).toEqual(true)
    expect(helloController.superClass.isStimulusDescendant).toEqual(true)
    expect(applicationController.isStimulusDescendant).toEqual(true)

    expect(helloController.className).toEqual(undefined)
    expect(applicationController.className).toEqual(undefined)

    expect(helloController.superClass).toEqual(applicationController)
    expect(project.relativePath(helloController.superClass.sourceFile.path)).toEqual("application_controller.js")

    expect(helloController.superClass).toBeInstanceOf(ClassDeclaration)
    expect(helloController.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)
    expect(helloController.superClass.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
  })
})

describe("with controller from stimulus package", () => {
  test("parse parent with default import", async () => {
    const code = dedent`
      import SomeController from "stimulus-dropdown"

      export default class extends SomeController {}
    `

    const sourceFile = new SourceFile(project, "parent_controller.js", code)
    project.projectFiles.push(sourceFile)

    await project.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]

    expect(sourceFile.classDeclarations.length).toEqual(1)
    expect(classDeclaration.isStimulusDescendant).toEqual(true)
    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual("i")
    expect(classDeclaration.superClass.superClass.className).toEqual("e")
    expect(classDeclaration.superClass.superClass.isStimulusClassDeclaration).toEqual(true)
    expect(project.relativePath(classDeclaration.superClass.sourceFile.path)).toEqual("node_modules/stimulus-dropdown/dist/stimulus-dropdown.mjs")
  })

  test("parse parent with regular import", async () => {
    const project = setupProject("packages/tailwindcss-stimulus-components")

    const code = dedent`
      import { Modal } from "tailwindcss-stimulus-components"

      export default class extends Modal {}
    `

    const sourceFile = new SourceFile(project, "parent_controller.js", code)
    project.projectFiles.push(sourceFile)

    await project.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]
    expect(classDeclaration).toBeDefined()

    expect(sourceFile.errors.length).toEqual(0)
    expect(sourceFile.classDeclarations.length).toEqual(1)
    expect(classDeclaration.isStimulusDescendant).toEqual(true)
    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual(undefined)
    expect(classDeclaration.superClass.superClass.isStimulusClassDeclaration).toEqual(true)
  })
})

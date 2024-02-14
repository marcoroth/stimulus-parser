import dedent from "dedent"
import { expect, test, describe } from "vitest"
import { setupProject } from "../helpers/setup"

import { SourceFile } from "../../src/source_file"

const project = setupProject()

describe("@hotwired/stimulus Controller", () => {
  test("parse parent", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {}
    `

    const sourceFile = new SourceFile("parent_controller.js", code, project)
    sourceFile.analyze()

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

  test("parse parent with import alias", () => {
    const code = dedent`
      import { Controller as StimulusController } from "@hotwired/stimulus"

      export default class extends StimulusController {}
    `

    const sourceFile = new SourceFile("parent_controller.js", code, project)
    sourceFile.analyze()

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
  test("parse parent", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class AbstractController extends Controller {}

      export default class extends AbstractController {}
    `

    const sourceFile = new SourceFile("parent_controller.js", code, project)
    sourceFile.analyze()

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
  test("parse parent", () => {
    const code = dedent`
      import ApplicationController from "./application_controller"

      export default class extends ApplicationController {}
    `

    const sourceFile = new SourceFile("parent_controller.js", code, project)
    sourceFile.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]

    expect(sourceFile.classDeclarations.length).toEqual(1)

    // TODO: this should be true at some point if the ApplicationController in other file inherits from the Stimulus controller
    expect(classDeclaration.isStimulusDescendant).toEqual(false)

    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual("ApplicationController")
    expect(classDeclaration.superClass.importDeclaration.localName).toEqual("ApplicationController")
    expect(classDeclaration.superClass.importDeclaration.originalName).toEqual(undefined)
    expect(classDeclaration.superClass.importDeclaration.source).toEqual("./application_controller")
    expect(classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(false)

    // TODO: This should probably also be populated
    expect(classDeclaration.superClass.superClass).toEqual(undefined)
  })
})

describe("with controller from stimulus package", () => {
  test("parse parent with default import", () => {
    const code = dedent`
      import SomeController from "some-package"

      export default class extends SomeController {}
    `

    const sourceFile = new SourceFile("parent_controller.js", code, project)
    sourceFile.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]

    expect(sourceFile.classDeclarations.length).toEqual(1)
    expect(classDeclaration.isStimulusDescendant).toEqual(false)
    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual("SomeController")
    expect(classDeclaration.superClass.importDeclaration.localName).toEqual("SomeController")
    expect(classDeclaration.superClass.importDeclaration.originalName).toEqual(undefined)
    expect(classDeclaration.superClass.importDeclaration.source).toEqual("some-package")
    expect(classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(false)
    expect(classDeclaration.superClass.superClass).toEqual(undefined)
  })

  test("parse parent with regular import", () => {
    const code = dedent`
      import { SomeController } from "some-package"

      export default class extends SomeController {}
    `

    const sourceFile = new SourceFile("parent_controller.js", code, project)
    sourceFile.analyze()

    const classDeclaration = sourceFile.classDeclarations[0]

    expect(sourceFile.classDeclarations.length).toEqual(1)
    expect(classDeclaration.isStimulusDescendant).toEqual(false)
    expect(classDeclaration.className).toEqual(undefined)
    expect(classDeclaration.superClass.className).toEqual("SomeController")
    expect(classDeclaration.superClass.importDeclaration.localName).toEqual("SomeController")
    expect(classDeclaration.superClass.importDeclaration.originalName).toEqual("SomeController")
    expect(classDeclaration.superClass.importDeclaration.source).toEqual("some-package")
    expect(classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(false)
    expect(classDeclaration.superClass.superClass).toEqual(undefined)
  })
})

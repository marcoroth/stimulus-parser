import { expect, test, describe } from "vitest"
import { setupParser } from "../helpers/setup"

const parser = setupParser()

describe("@hotwired/stimulus Controller", () => {
  test("parse parent", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {}
    `
    const controller = parser.parseController(code, "parent_controller.js")

    expect(controller.parent.constant).toEqual("Controller")
    expect(controller.parent.type).toEqual("default")
    expect(controller.parent.package).toEqual("@hotwired/stimulus")
    expect(controller.parent.definition).toEqual(undefined)
    expect(controller.parent.identifier).toEqual(undefined)
    expect(controller.parent.controllerFile).toEqual(undefined)
  })

  test("parse parent with import alias", () => {
    const code = `
      import { Controller as StimulusController } from "@hotwired/stimulus"

      export default class extends StimulusController {}
    `
    const controller = parser.parseController(code, "parent_controller.js")

    expect(controller.parent.constant).toEqual("StimulusController")
    expect(controller.parent.type).toEqual("default")
    expect(controller.parent.package).toEqual("@hotwired/stimulus")
    expect(controller.parent.definition).toEqual(undefined)
    expect(controller.parent.parent).toEqual(undefined)
    expect(controller.parent.identifier).toEqual(undefined)
    expect(controller.parent.controllerFile).toEqual(undefined)
  })
})

describe("with controller in same file", () => {
  test("parse parent", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      class AbstractController extends Controller {}

      export default class extends AbstractController {}
    `
    const controller = parser.parseController(code, "parent_controller.js")

    expect(controller.parent.constant).toEqual("AbstractController")
    expect(controller.parent.type).toEqual("unknown")
    expect(controller.parent.package).toEqual(undefined)
    expect(controller.parent.definition).toEqual(undefined)
    expect(controller.parent.parent).toEqual(undefined)
    expect(controller.parent.identifier).toEqual(undefined)
    expect(controller.parent.controllerFile).toEqual(undefined)
    // expect(controller.parent.controllerFile).toEqual("app/javascript/controllers/parent_controller.js")
  })
})

describe("with controller from other file", () => {
  test("parse parent", () => {
    const code = `
      import ApplicationController from "./application_controller"

      export default class extends ApplicationController {}
    `
    const controller = parser.parseController(code, "parent_controller.js")

    expect(controller.parent.constant).toEqual("ApplicationController")
    expect(controller.parent.type).toEqual("import")
    expect(controller.parent.package).toEqual("./application_controller")
    expect(controller.parent.definition).toEqual(undefined)
    expect(controller.parent.parent).toEqual(undefined)
    expect(controller.parent.identifier).toEqual(undefined)
    expect(controller.parent.controllerFile).toEqual(undefined)
    // expect(controller.parent.controllerFile).toEqual("app/javascript/controllers/application_controller.js")
  })
})

describe("with controller from stimulus package", () => {
  test("parse parent with default import", () => {
    const code = `
      import SomeController from "some-package"

      export default class extends SomeController {}
    `
    const controller = parser.parseController(code, "parent_controller.js")

    expect(controller.parent.constant).toEqual("SomeController")
    expect(controller.parent.type).toEqual("import")
    expect(controller.parent.package).toEqual("some-package")
    expect(controller.parent.definition).toEqual(undefined)
    expect(controller.parent.parent).toEqual(undefined)
    expect(controller.parent.identifier).toEqual(undefined)
    expect(controller.parent.controllerFile).toEqual(undefined)
    // expect(controller.parent.controllerFile).toEqual("some-package/dist/some_controller.js")
  })

  test("parse parent with regular import", () => {
    const code = `
      import { SomeController } from "some-package"

      export default class extends SomeController {}
    `
    const controller = parser.parseController(code, "parent_controller.js")

    expect(controller.parent.constant).toEqual("SomeController")
    expect(controller.parent.type).toEqual("import")
    expect(controller.parent.package).toEqual("some-package")
    expect(controller.parent.definition).toEqual(undefined)
    expect(controller.parent.parent).toEqual(undefined)
    expect(controller.parent.identifier).toEqual(undefined)
    expect(controller.parent.controllerFile).toEqual(undefined)
    // expect(controller.parent.controllerFile).toEqual("some-package/dist/some_controller.js")
  })
})

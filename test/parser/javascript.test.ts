import { expect, test, vi, describe } from "vitest"
import { setupParser } from "../helpers/setup"

const parser = setupParser()

describe("with JS Syntax", () => {
  test("parse targets", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parser.parseController(code, "target_controller.js")

    expect(controller.targets).toEqual(["one", "two", "three"])
  })

  test("parse classes", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "two", "three"]
      }
    `
    const controller = parser.parseController(code, "class_controller.js")

    expect(controller.classes).toEqual(["one", "two", "three"])
  })

  test("parse values", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static values = {
          string: String,
          object: Object,
          boolean: Boolean,
          array: Array,
          number: Number
        }
      }
    `
    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.values).toEqual({
      string: { type: "String", default: "" },
      object: { type: "Object", default: {} },
      boolean: { type: "Boolean", default: false },
      array: { type: "Array", default: [] },
      number: { type: "Number", default: 0 },
    })
  })

  test("parse values with with default values", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static values = {
          string: { type: String, default: "string" },
          object: { type: Object, default: { object: "Object" } },
          boolean: { type: Boolean, default: true },
          array: { type: Array, default: ["Array"] },
          number: { type: Number, default: 1 }
        }
      }
    `
    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.values).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: { object: "Object" } },
      boolean: { type: "Boolean", default: true },
      array: { type: "Array", default: ["Array"] },
      number: { type: "Number", default: 1 },
    })
  })

  test("should handle syntax errors", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
    `
    const spy = vi.spyOn(console, 'error')

    const controller = parser.parseController(code, "error_controller.js")

    expect(controller.identifier).toEqual("error")
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual("Error parsing controller")
    expect(controller.errors[0].cause.message).toEqual("'}' expected.")
    // expect(controller.errors[0].loc.start.line).toEqual(9)
    // expect(controller.errors[0].loc.end.line).toEqual(9)

    expect(spy).toBeCalledWith("Error while parsing controller in 'error_controller.js': '}' expected.")
  })

  test("parse arrow function", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        connect() {
          document.addEventListener('event', this.load)
        }

        load = (event) => {
          anotherArrowFunction = (something) => {

          }
        }
      }
    `

    const controller = parser.parseController(code, "controller.js")

    expect(controller.methods).toEqual(["connect", "load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse methods", () => {
    const code = `
      export default class extends Controller {
        load() {}
        unload() {}
      }
    `
    const controller = parser.parseController(code, "controller.js")

    expect(controller.methods).toEqual(["load", "unload"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse private methods", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        #load() {}
      }
    `
    const controller = parser.parseController(code, "controller.js")

    expect(controller.methods).toEqual(["#load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse controller with public class fields", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        instanceField
        instanceFieldWithInitializer = "instance field"
        static staticField
        static staticFieldWithInitializer = "static field"
      }
    `

    const controller = parser.parseController(code, "controller.js")

    expect(controller.methods).toEqual([])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse controller with private getter", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        get #privateGetter () {
          return true
        }
      }
    `

    const controller = parser.parseController(code, "controller.js")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
    expect(controller.methods).toEqual([])
  })

  test("parse controller with private setter", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        set #privateSetter (value) {
          // set
        }
      }
    `

    const controller = parser.parseController(code, "controller.js")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
    expect(controller.methods).toEqual([])
  })

  test("parse controller with variable declaration in method body", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        method(value) {
          const variable = 0
        }
      }
    `

    const controller = parser.parseController(code, "controller.js")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
    expect(controller.methods).toEqual(["method"])
  })
})

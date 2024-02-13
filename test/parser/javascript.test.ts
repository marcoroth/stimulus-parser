import { expect, test, vi, describe } from "vitest"

import { parseController } from "../helpers/parse"

import { Project } from "../../src/project"
import { SourceFile } from "../../src/source_file"

describe("with JS Syntax", () => {
  test("doesn't parse non Stimulus class", () => {
    const code = `
      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "target_controller.js")

    expect(controller).toBeUndefined()
  })

  test("parse targets", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "target_controller.js")

    expect(controller.targetNames).toEqual(["one", "two", "three"])
  })

  test("parse classes", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "class_controller.js")

    expect(controller.classNames).toEqual(["one", "two", "three"])
  })

  test("parse classes with spread", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static spread = ["one", "two"]
        static classes = [...this.spread, "three"]
      }
    `
    const controller = parseController(code, "class_controller.js")

    expect(controller.classNames).toEqual(["three"])

    // TODO: this is expected
    // expect(controller.classNames).toEqual(["one", "two", "three"])
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
    const controller = parseController(code, "value_controller.js")

    expect(controller.valueDefinitions).toEqual({
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
    const controller = parseController(code, "value_controller.js")

    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: { object: "Object" } },
      boolean: { type: "Boolean", default: true },
      array: { type: "Array", default: ["Array"] },
      number: { type: "Number", default: 1 },
    })
  })

  test("parse values with spread", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static spread = {
          string: { type: String, default: "string" },
          object: { type: Object, default: { object: "Object" } }
        }

        static values = {
          ...this.spread,
          boolean: { type: Boolean, default: true },
          array: { type: Array, default: ["Array"] },
          number: { type: Number, default: 1 }
        }
      }
    `
    const controller = parseController(code, "value_controller.js")

    // TODO: this is expected
    expect(controller.valueDefinitions).toEqual({
      // string: { type: "String", default: "string" },
      // object: { type: "Object", default: { object: "Object" } },
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

    const sourceFile = new SourceFile("error_controller.js", code, new Project(process.cwd()))
    sourceFile.analyze()

    // expect(sourceFile.identifier).toEqual("error")
    expect(sourceFile.hasErrors).toBeTruthy()
    expect(sourceFile.errors).toHaveLength(1)
    expect(sourceFile.errors[0].message).toEqual("Error parsing controller")
    expect(sourceFile.errors[0].cause.message).toEqual("'}' expected.")
    // expect(sourceFile.errors[0].loc.start.line).toEqual(9)
    // expect(sourceFile.errors[0].loc.end.line).toEqual(9)

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

    const controller = parseController(code, "controller.js")

    expect(controller.methodNames).toEqual(["connect", "load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse methods", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        load() {}
        unload() {}
      }
    `
    const controller = parseController(code, "controller.js")

    expect(controller.methodNames).toEqual(["load", "unload"])
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
    const controller = parseController(code, "controller.js")

    expect(controller.methodNames).toEqual(["#load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse nested object/array default value types", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static values = {
          object: { type: Object, default: { object: { some: { more: { levels: {} } } } } },
          array: { type: Array, default: [["Array", "with", ["nested", ["values"]]]] },
        }
      }
    `
    const controller = parseController(code, "value_controller.js")

    expect(controller.valueDefinitions).toEqual({
      object: { type: "Object", default: { object: { some: { more: { levels: {} } } } } },
      array: { type: "Array", default: [["Array", "with", ["nested", ["values"]]]] },
    })
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

    const controller = parseController(code, "controller.js")

    expect(controller.methodNames).toEqual([])
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

    const controller = parseController(code, "controller.js")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
    expect(controller.methodNames).toEqual([])
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

    const controller = parseController(code, "controller.js")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
    expect(controller.methodNames).toEqual([])
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

    const controller = parseController(code, "controller.js")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
    expect(controller.methodNames).toEqual(["method"])
  })
})

import { expect, test, vi } from "vitest"
import { Project, Parser } from "../src"

const project = new Project("/Users/marcoroth/Development/stimulus-parser")
const parser = new Parser(project)

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

test.only("parse values", () => {
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

test.skip("parse values with with default values", () => {
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

test.skip("should handle syntax errors", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
  `
  const spy = vi.spyOn(console, 'error')

  const controller = parser.parseController(code, "error_controller.js")

  expect(controller.identifier).toEqual("error")
  expect(controller.parseError).toEqual("Unexpected token (5:2)")

  expect(spy).toBeCalledWith("Error while parsing controller in 'error_controller.js': Unexpected token (5:2)")
})

test("parse arrow function", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      connect() {
        document.addEventListener('event', this.load)
      }

      load = (event) => {}
    }
  `

  const controller = parser.parseController(code, "controller.js")

  expect(controller.methods).toEqual(["connect", "load"])
  expect(controller.parseError).toBeUndefined()
})

test("parse private methods", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      #load() {}
    }
  `
  const controller = parser.parseController(code, "controller.js")

  expect(controller.methods).toEqual(["load"])
  expect(controller.parseError).toBeUndefined()
})

test.skip("parse nested object/array default value types", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      static values = {
        object: { type: Object, default: { object: { some: { more: { levels: {} } } } } },
        array: { type: Array, default: [["Array", "with", ["nested", ["values"]]]] },
      }
    }
  `
  const controller = parser.parseController(code, "value_controller.js")

  expect(controller.values).toEqual({
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

  const controller = parser.parseController(code, "controller.js")

  expect(controller.parseError).toBeUndefined()
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

  expect(controller.parseError).toBeUndefined()
  expect(controller.methods).toEqual([])
})

test.skip("parse controller with private setter", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      set #privateSetter (value) {
        // set
      }
    }
  `

  const controller = parser.parseController(code, "controller.js")

  expect(controller.parseError).toBeUndefined()
  expect(controller.methods).toEqual([])
})

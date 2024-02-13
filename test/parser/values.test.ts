import { describe, expect, test } from "vitest"
import { parseController } from "../helpers/parse"

describe("parse values", () => {
  test("static", () => {
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

    expect(controller.isTyped).toBeFalsy()
    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "" },
      object: { type: "Object", default: {} },
      boolean: { type: "Boolean", default: false },
      array: { type: "Array", default: [] },
      number: { type: "Number", default: 0 },
    })
  })

  test("static with default values", () => {
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

    expect(controller.isTyped).toBeFalsy()
    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: { object: "Object" } },
      boolean: { type: "Boolean", default: true },
      array: { type: "Array", default: ["Array"] },
      number: { type: "Number", default: 1 },
    })
  })

  test("duplicate static values", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static values = {
          one: String,
          one: { type: "String", default: ""},
          three: { type: "String", default: ""},
        }
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(Object.keys(controller.valueDefinitions)).toEqual(["one", "three"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus value "one"`)
    expect(controller.errors[0].loc.start.line).toEqual(5)
    expect(controller.errors[0].loc.end.line).toEqual(9)
  })

  test("duplicate decorator mixed with static values", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Value(String) oneValue!: string;

        static values = {
          one: { type: "String", default: ""}
        }
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(Object.keys(controller.valueDefinitions)).toEqual(["one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus value "one"`)
    expect(controller.errors[0].loc.start.line).toEqual(9)
    expect(controller.errors[0].loc.end.line).toEqual(11)
  })

  test("duplicate static values mixed with decorator", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        static values = {
          one: { type: "String", default: ""}
        }

        @Value(String) oneValue!: string;
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(Object.keys(controller.valueDefinitions)).toEqual(["one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus value "one"`)
    expect(controller.errors[0].loc.start.line).toEqual(7)
    expect(controller.errors[0].loc.end.line).toEqual(9)
  })

  test("decorated", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus";
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Value(String) stringValue!: string;
        @Value(Object) objectValue!: {};
        @Value(Boolean) booleanValue!: boolean;
        @Value(Array) arrayValue!: [];
        @Value(Number) numberValue!: number;
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "" },
      object: { type: "Object", default: {} },
      boolean: { type: "Boolean", default: false },
      array: { type: "Array", default: [] },
      number: { type: "Number", default: 0 },
    })
  })

  test("decorated with default values", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus";
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Value(String) stringValue! = "string"
        @Value(Object) objectValue! = {}
        @Value(Boolean) booleanValue! = false
        @Value(Array) arrayValue! = []
        @Value(Number) numberValue! = 10
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: {} },
      boolean: { type: "Boolean", default: false },
      array: { type: "Array", default: [] },
      number: { type: "Number", default: 10 },
    })
  })

  test("parse static value with nested object/array default value", () => {
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

    expect(controller.isTyped).toBeFalsy()
    expect(controller.valueDefinitions).toEqual({
      object: {
        type: "Object",
        default: { object: { some: { more: { levels: {} } } } },
      },
      array: {
        type: "Array",
        default: [["Array", "with", ["nested", ["values"]]]],
      },
    })
  })

  test("parse decorated @Value with nested object/array with default value", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus";
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Value(Object) objectValue! = { object: { some: { more: { levels: {} } } } }
        @Value(Array) arrayValue! = [["Array", "with", ["nested", ["values"]]]]
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.valueDefinitions).toEqual({
      object: {
        type: "Object",
        default: { object: { some: { more: { levels: {} } } } },
      },
      array: {
        type: "Array",
        default: [["Array", "with", ["nested", ["values"]]]],
      },
    })
  })
})

import { describe, expect, test } from "vitest"
import { setupParser } from "../helpers/setup"

const parser = setupParser()

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

    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.values).toEqual({
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

    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.values).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: { object: "Object" } },
      boolean: { type: "Boolean", default: true },
      array: { type: "Array", default: ["Array"] },
      number: { type: "Number", default: 1 },
    })
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

    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.values).toEqual({
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

    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.values).toEqual({
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

    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.values).toEqual({
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

    const controller = parser.parseController(code, "value_controller.js")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.values).toEqual({
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

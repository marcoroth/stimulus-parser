import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"
import { extractLoc } from "../helpers/matchers"

describe("parse values", () => {
  test("static", () => {
    const code = dedent`
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

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([8, 4, 8, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([8, 11, 8, 16])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([8, 11, 8, 16])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: [],
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.boolean.keyLoc)).toEqual([7, 4, 7, 11])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.valueLoc)).toEqual([7, 13, 7, 20])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.typeLoc)).toEqual([7, 13, 7, 20])
    expect(controller.valueDefinitionsMap.boolean.definition).toEqual({
      type: "Boolean",
      default: false,
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([9, 4, 9, 10])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([9, 12, 9, 18])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([9, 12, 9, 18])
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 0,
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([6, 4, 6, 10])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([6, 12, 6, 18])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([6, 12, 6, 18])
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: {},
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([5, 4, 5, 10])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([5, 12, 5, 18])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([5, 12, 5, 18])
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "",
      kind: "shorthand",
    })
  })

  test("static with default values", () => {
    const code = dedent`
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

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([5, 4, 5, 10])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([5, 12, 5, 47])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([5, 20, 5, 26])
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "string",
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([6, 4, 6, 10])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([6, 12, 6, 59])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([6, 20, 6, 26])
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: { object: "Object" },
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.boolean.keyLoc)).toEqual([7, 4, 7, 11])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.valueLoc)).toEqual([7, 13, 7, 45])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.typeLoc)).toEqual([7, 21, 7, 28])
    expect(controller.valueDefinitionsMap.boolean.definition).toEqual({
      type: "Boolean",
      default: true,
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([8, 4, 8, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([8, 11, 8, 46])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([8, 19, 8, 24])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: ["Array"],
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([9, 4, 9, 10])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([9, 12, 9, 40])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([9, 20, 9, 26])
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 1,
      kind: "expanded",
    })
  })

  test("duplicate static values", () => {
    const code = dedent`
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
    expect(controller.valueNames).toEqual(["one", "one", "three"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Value "one"`)
    expect(extractLoc(controller.errors[0].loc)).toEqual([5, 4, 5, 7])
  })

  test("duplicate static values from parent", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class Parent extends Controller {
        static values = {
          one: String,
        }
      }

      export default class Child extends Parent {
        static values = {
          one: { type: "String", default: ""},
          three: { type: "String", default: ""},
        }
      }
    `

    const controller = parseController(code, "target_controller.js", "Child")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.valueNames).toEqual(["one", "three", "one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Value "one". A parent controller already defines this Value.`)
    expect(extractLoc(controller.errors[0].loc)).toEqual([11, 4, 11, 7])
  })

  test("assigns values outside of class via member expression", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class One extends Controller {}
      class Two extends Controller {}

      One.values = {
        one: String,
        two: Boolean
      }
    `

    const one = parseController(code, "values_controller.js", "One")
    const two = parseController(code, "values_controller.js", "Two")

    expect(one.isTyped).toBeFalsy()
    expect(one.valueNames).toEqual(["one", "two"])
    expect(one.hasErrors).toBeFalsy()

    expect(two.isTyped).toBeFalsy()
    expect(two.valueNames).toEqual([])
    expect(two.hasErrors).toBeFalsy()
  })

  test("duplicate decorator mixed with static values", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Value(String) oneValue!: string;

        static values = {
          one: { type: "String", default: "" }
        }
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.valueNames).toEqual(["one", "one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Value "one"`)
    expect(extractLoc(controller.errors[0].loc)).toEqual([9, 4, 9, 7])
  })

  test("duplicate static values mixed with decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        static values = {
          one: { type: "String", default: "" }
        }

        @Value(String) oneValue!: string;
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.valueNames).toEqual(["one", "one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Value "one"`)
    expect(extractLoc(controller.errors[0].loc)).toEqual([7, 4, 7, 7])
  })

  test("decorated", () => {
    const code = dedent`
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

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([6, 17, 6, 28])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([6, 2, 6, 38])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([6, 2, 6, 16])
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "",
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([7, 17, 7, 28])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([7, 2, 7, 34])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([7, 2, 7, 16])
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: {},
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.boolean.keyLoc)).toEqual([8, 18, 8, 30])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.valueLoc)).toEqual([8, 2, 8, 41])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.typeLoc)).toEqual([8, 2, 8, 17])
    expect(controller.valueDefinitionsMap.boolean.definition).toEqual({
      type: "Boolean",
      default: false,
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([9, 16, 9, 26])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([9, 2, 9, 32])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([9, 2, 9, 15])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: [],
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([10, 17, 10, 28])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([10, 2, 10, 38])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([10, 2, 10, 16])
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 0,
      kind: "decorator",
    })
  })

  test("decorated with default values", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus";
      import { Value, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Value(String) stringValue! = "string"
        @Value(Object) objectValue! = { hello: "world" }
        @Value(Boolean) booleanValue! = true
        @Value(Array) arrayValue! = [1, 2, 3]
        @Value(Number) numberValue! = 10
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeTruthy()

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([6, 17, 6, 28])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([6, 32, 6, 40])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([6, 2, 6, 16])
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "string",
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([7, 17, 7, 28])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([7, 32, 7, 50])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([7, 2, 7, 16])
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: { hello: "world" },
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.boolean.keyLoc)).toEqual([8, 18, 8, 30])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.valueLoc)).toEqual([8, 34, 8, 38])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.typeLoc)).toEqual([8, 2, 8, 17])
    expect(controller.valueDefinitionsMap.boolean.definition).toEqual({
      type: "Boolean",
      default: true,
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([9, 16, 9, 26])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([9, 30, 9, 39])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([9, 2, 9, 15])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: [1, 2, 3],
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([10, 17, 10, 28])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([10, 32, 10, 34])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([10, 2, 10, 16])
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 10,
      kind: "decorator",
    })
  })

  test("parse static value with nested object/array default value", () => {
    const code = dedent`
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

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([5, 4, 5, 10])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([5, 12, 5, 85])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([5, 20, 5, 26])
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: { object: { some: { more: { levels: {} } } } },
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([6, 4, 6, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([6, 11, 6, 80])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([6, 19, 6, 24])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: [["Array", "with", ["nested", ["values"]]]],
      kind: "expanded",
    })
  })

  test("parse decorated @Value with nested object/array with default value", () => {
    const code = dedent`
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

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([6, 17, 6, 28])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([6, 32, 6, 78])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([6, 2, 6, 16])
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: { object: { some: { more: { levels: {} } } } },
      kind: "decorator",
    })

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([7, 16, 7, 26])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([7, 30, 7, 73])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([7, 2, 7, 15])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: [["Array", "with", ["nested", ["values"]]]],
      kind: "decorator",
    })
  })

  test.todo("implicit version", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus";

      export default class extends Controller {
        static values = {
          string: "Number"
        }
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeFalsy()

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([])
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "Number",
      kind: "inferred",
    })
  })

  test("shorthand-version", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus";

      export default class extends Controller {
        static values = {
          name: String,
        }
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeFalsy()
    expect(extractLoc(controller.valueDefinitionsMap.name.keyLoc)).toEqual([5, 4, 5, 8])
    expect(extractLoc(controller.valueDefinitionsMap.name.valueLoc)).toEqual([5, 10, 5, 16])
    expect(extractLoc(controller.valueDefinitionsMap.name.typeLoc)).toEqual([5, 10, 5, 16])
    expect(controller.valueDefinitionsMap.name.definition).toEqual({
      type: "String",
      default: "",
      kind: "shorthand",
    })
  })

  test("expanded-version", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus";

      export default class extends Controller {
        static values = {
          name: {
            type: String,
            default: "Stimulus"
          }
        }
      }
    `

    const controller = parseController(code, "value_controller.ts")

    expect(controller.isTyped).toBeFalsy()

    expect(extractLoc(controller.valueDefinitionsMap.name.keyLoc)).toEqual([5, 4, 5, 8])
    expect(extractLoc(controller.valueDefinitionsMap.name.valueLoc)).toEqual([5, 10, 8, 5])
    expect(extractLoc(controller.valueDefinitionsMap.name.typeLoc)).toEqual([6, 12, 6, 18])
    expect(controller.valueDefinitionsMap.name.definition).toEqual({
      type: "String",
      default: "Stimulus",
      kind: "expanded",
    })
  })
})

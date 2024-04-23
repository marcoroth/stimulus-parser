import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"

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
    expect(controller.valueDefinitionsMap).toEqual({
      array: {
        type: "Array",
        default: [],
        kind: "shorthand",
      },
      boolean: {
        type: "Boolean",
        default: false,
        kind: "shorthand",
      },
      number: {
        type: "Number",
        default: 0,
        kind: "shorthand",
      },
      object: {
        type: "Object",
        default: {},
        kind: "shorthand",
      },
      string: {
        type: "String",
        default: "",
        kind: "shorthand",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      string: {
        type: "String",
        default: "string",
        kind: "expanded",
      },
      object: {
        type: "Object",
        default: { object: "Object" },
        kind: "expanded",
      },
      boolean: {
        type: "Boolean",
        default: true,
        kind: "expanded",
      },
      array: {
        type: "Array",
        default: ["Array"],
        kind: "expanded",
      },
      number: {
        type: "Number",
        default: 1,
        kind: "expanded",
      },
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
    expect(controller.errors[0].loc.start.line).toEqual(6)
    expect(controller.errors[0].loc.start.column).toEqual(4)
    expect(controller.errors[0].loc.end.line).toEqual(6)
    expect(controller.errors[0].loc.end.column).toEqual(7)
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
    expect(controller.errors[0].loc.start.line).toEqual(11)
    expect(controller.errors[0].loc.start.column).toEqual(4)
    expect(controller.errors[0].loc.end.line).toEqual(11)
    expect(controller.errors[0].loc.end.column).toEqual(7)
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
          one: { type: "String", default: ""}
        }
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.valueNames).toEqual(["one", "one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Value "one"`)
    expect(controller.errors[0].loc.start.line).toEqual(9)
    expect(controller.errors[0].loc.start.column).toEqual(4)
    expect(controller.errors[0].loc.end.line).toEqual(9)
    expect(controller.errors[0].loc.end.column).toEqual(7)
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
    expect(controller.errors[0].loc.start.line).toEqual(7)
    expect(controller.errors[0].loc.start.column).toEqual(4)
    expect(controller.errors[0].loc.end.line).toEqual(7)
    expect(controller.errors[0].loc.end.column).toEqual(7)
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
    expect(controller.valueDefinitionsMap).toEqual({
      array: {
        type: "Array",
        default: [],
        kind: "decorator",
      },
      boolean: {
        type: "Boolean",
        default: false,
        kind: "decorator",
      },
      number: {
        type: "Number",
        default: 0,
        kind: "decorator",
      },
      object: {
        type: "Object",
        default: {},
        kind: "decorator",
      },
      string: {
        type: "String",
        default: "",
        kind: "decorator",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      array: {
        type: "Array",
        default: [1, 2, 3],
        kind: "decorator",
      },
      boolean: {
        type: "Boolean",
        default: true,
        kind: "decorator",
      },
      number: {
        type: "Number",
        default: 10,
        kind: "decorator",
      },
      object: {
        type: "Object",
        default: { hello: "world" },
        kind: "decorator",
      },
      string: {
        type: "String",
        default: "string",
        kind: "decorator",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      object: {
        type: "Object",
        default: { object: { some: { more: { levels: {} } } } },
        kind: "expanded",
      },
      array: {
        type: "Array",
        default: [["Array", "with", ["nested", ["values"]]]],
        kind: "expanded",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      array: {
        type: "Array",
        default: [["Array", "with", ["nested", ["values"]]]],
        kind: "decorator",
      },
      object: {
        type: "Object",
        default: { object: { some: { more: { levels: {} } } } },
        kind: "decorator",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      string: {
        type: "String",
        default: "Number",
        kind: "inferred",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      name: {
        type: "String",
        default: "",
        kind: "shorthand",
      },
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
    expect(controller.valueDefinitionsMap).toEqual({
      name: {
        type: "String",
        default: "Stimulus",
        kind: "expanded",
      },
    })
  })
})

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
        keyLoc: {
          end: { column: 9, line: 8 },
          start: { column: 4, line: 8 },
        },
        valueLoc: {
          end: { column: 16, line: 8 },
          start: { column: 11, line: 8 },
        },
      },
      boolean: {
        type: "Boolean",
        default: false,
        kind: "shorthand",
        keyLoc: {
          end: { column: 11, line: 7 },
          start: { column: 4, line: 7 },
        },
        valueLoc: {
          end: { column: 20, line: 7 },
          start: { column: 13, line: 7 },
        },
      },
      number: {
        type: "Number",
        default: 0,
        kind: "shorthand",
        keyLoc: {
          end: { column: 10, line: 9 },
          start: { column: 4, line: 9 },
        },
        valueLoc: {
          end: { column: 18, line: 9 },
          start: { column: 12, line: 9 },
        },
      },
      object: {
        type: "Object",
        default: {},
        kind: "shorthand",
        keyLoc: {
          end: { column: 10, line: 6 },
          start: { column: 4, line: 6 },
        },
        valueLoc: {
          end: { column: 18, line: 6 },
          start: { column: 12, line: 6 },
        },
      },
      string: {
        type: "String",
        default: "",
        kind: "shorthand",
        keyLoc: {
          end: { column: 10, line: 5 },
          start: { column: 4, line: 5 },
        },
        valueLoc: {
          end: { column: 18, line: 5 },
          start: { column: 12, line: 5 },
        },
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
        kind: "explicit",
        valueLoc: {
          end: { column: 26, line: 5 },
          start: { column: 20, line: 5 },
        },
        keyLoc: {
          end: { column: 18, line: 5 },
          start: { column: 14, line: 5 },
        },
      },
      object: {
        type: "Object",
        default: { object: "Object" },
        kind: "explicit",
        valueLoc: {
          end: { column: 26, line: 6 },
          start: { column: 20, line: 6 },
        },
        keyLoc: {
          end: { column: 18, line: 6 },
          start: { column: 14, line: 6 },
        },
      },
      boolean: {
        type: "Boolean",
        default: true,
        kind: "explicit",
        valueLoc: {
          end: { column: 28, line: 7 },
          start: { column: 21, line: 7 },
        },
        keyLoc: {
          end: { column: 19, line: 7 },
          start: { column: 15, line: 7 },
        },
      },
      array: {
        type: "Array",
        default: ["Array"],
        kind: "explicit",
        valueLoc: {
          end: { column: 24, line: 8 },
          start: { column: 19, line: 8 },
        },
        keyLoc: {
          end: { column: 17, line: 8 },
          start: { column: 13, line: 8 },
        },
      },
      number: {
        type: "Number",
        default: 1,
        kind: "explicit",
        valueLoc: {
          end: { column: 26, line: 9 },
          start: { column: 20, line: 9 },
        },
        keyLoc: {
          end: { column: 18, line: 9 },
          start: { column: 14, line: 9 },
        },
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
    expect(controller.errors[0].loc.start.line).toEqual(4)
    expect(controller.errors[0].loc.start.column).toEqual(18)
    expect(controller.errors[0].loc.end.line).toEqual(8)
    expect(controller.errors[0].loc.end.column).toEqual(3)
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
    expect(controller.errors[0].loc.start.line).toEqual(10)
    expect(controller.errors[0].loc.start.column).toEqual(18)
    expect(controller.errors[0].loc.end.line).toEqual(13)
    expect(controller.errors[0].loc.end.column).toEqual(3)
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
    expect(controller.errors[0].loc.start.line).toEqual(8)
    expect(controller.errors[0].loc.start.column).toEqual(18)
    expect(controller.errors[0].loc.end.line).toEqual(10)
    expect(controller.errors[0].loc.end.column).toEqual(3)
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
    expect(controller.errors[0].loc.start.line).toEqual(6)
    expect(controller.errors[0].loc.start.column).toEqual(18)
    expect(controller.errors[0].loc.end.line).toEqual(8)
    expect(controller.errors[0].loc.end.column).toEqual(3)
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
        keyLoc: { end: { column: 15, line: 9 }, start: { column: 2, line: 9 } },
        valueLoc: { end: { column: 32, line: 9 }, start: { column: 2, line: 9 } },
      },
      boolean: {
        type: "Boolean",
        default: false,
        kind: "decorator",
        keyLoc: { end: { column: 17, line: 8 }, start: { column: 2, line: 8 } },
        valueLoc: { end: { column: 41, line: 8 }, start: { column: 2, line: 8 } },
      },
      number: {
        type: "Number",
        default: 0,
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 10 }, start: { column: 2, line: 10 } },
        valueLoc: { end: { column: 38, line: 10 }, start: { column: 2, line: 10 } },
      },
      object: {
        type: "Object",
        default: {},
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 7 }, start: { column: 2, line: 7 } },
        valueLoc: { end: { column: 34, line: 7 }, start: { column: 2, line: 7 } },
      },
      string: {
        type: "String",
        default: "",
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 6 }, start: { column: 2, line: 6 } },
        valueLoc: { end: { column: 38, line: 6 }, start: { column: 2, line: 6 } },
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
        keyLoc: { end: { column: 15, line: 9 }, start: { column: 2, line: 9 } },
        valueLoc: { end: { column: 39, line: 9 }, start: { column: 2, line: 9 } },
      },
      boolean: {
        type: "Boolean",
        default: true,
        kind: "decorator",
        keyLoc: { end: { column: 17, line: 8 }, start: { column: 2, line: 8 } },
        valueLoc: { end: { column: 38, line: 8 }, start: { column: 2, line: 8 } },
      },
      number: {
        type: "Number",
        default: 10,
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 10 }, start: { column: 2, line: 10 } },
        valueLoc: { end: { column: 34, line: 10 }, start: { column: 2, line: 10 } },
      },
      object: {
        type: "Object",
        default: { hello: "world" },
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 7 }, start: { column: 2, line: 7 } },
        valueLoc: { end: { column: 50, line: 7 }, start: { column: 2, line: 7 } },
      },
      string: {
        type: "String",
        default: "string",
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 6 }, start: { column: 2, line: 6 } },
        valueLoc: { end: { column: 40, line: 6 }, start: { column: 2, line: 6 } },
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
        kind: "explicit",
        keyLoc: { end: { column: 18, line: 5 }, start: { column: 14, line: 5 } },
        valueLoc: { end: { column: 26, line: 5 }, start: { column: 20, line: 5 } }
      },
      array: {
        type: "Array",
        default: [["Array", "with", ["nested", ["values"]]]],
        kind: "explicit",
        keyLoc: { end: { column: 17, line: 6 }, start: { column: 13, line: 6 } },
        valueLoc: { end: { column: 24, line: 6 }, start: { column: 19, line: 6 } }
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
        keyLoc: { end: { column: 15, line: 7 }, start: { column: 2, line: 7 } },
        valueLoc: { end: { column: 73, line: 7 }, start: { column: 2, line: 7 } },
      },
      object: {
        type: "Object",
        default: { object: { some: { more: { levels: {} } } } },
        kind: "decorator",
        keyLoc: { end: { column: 16, line: 6 }, start: { column: 2, line: 6 } },
        valueLoc: { end: { column: 78, line: 6 }, start: { column: 2, line: 6 } },
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
        keyLoc: { end: { column: 16, line: 6 }, start: { column: 2, line: 6 } },
        valueLoc: { end: { column: 78, line: 6 }, start: { column: 2, line: 6 } },
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
        keyLoc: { end: { column: 8, line: 5 }, start: { column: 4, line: 5 } },
        valueLoc: { end: { column: 16, line: 5 }, start: { column: 10, line: 5 } },
      },
    })
  })

  test("explicit-version", () => {
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
        kind: "explicit",
        keyLoc: { end: { column: 10, line: 6 }, start: { column: 6, line: 6 } },
        valueLoc: { end: { column: 18, line: 6 }, start: { column: 12, line: 6 } },
      },
    })
  })
})

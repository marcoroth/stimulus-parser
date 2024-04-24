import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"
import { extractLoc } from "../helpers/matchers"

import { Project } from "../../src/project"
import { SourceFile } from "../../src/source_file"

describe("with JS Syntax", () => {
  test("doesn't parse non Stimulus class", () => {
    const code = dedent`
      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "target_controller.js")

    expect(controller).toBeUndefined()
  })

  test("parse targets", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "target_controller.js")

    expect(controller.targetNames).toEqual(["one", "two", "three"])
  })

  test("parse classes", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "class_controller.js")

    expect(controller.classNames).toEqual(["one", "two", "three"])
  })

  // TODO: instead, we could also mark the SpreadElement node with
  // a warning that says that we couldn't parse it
  test.todo("parse classes with spread", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static spread = ["one", "two"]
        static classes = [...this.spread, "three"]
      }
    `
    const controller = parseController(code, "class_controller.js")

    expect(controller.classNames).toEqual(["three"])
    expect(controller.classNames).toEqual(["one", "two", "three"])
  })

  test("parse values", () => {
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

  test("parse values with with default values", () => {
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

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([8, 4, 8, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([8, 11, 8, 46])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([8, 19, 8, 24])
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: ["Array"],
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

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([9, 4, 9, 10])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([9, 12, 9, 40])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([9, 20, 9, 26])
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 1,
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

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([5, 4, 5, 10])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([5, 12, 5, 47])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([5, 20, 5, 26])
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "string",
      kind: "expanded",
    })
  })

  test.todo("parse values with spread", () => {
    const code = dedent`
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

    expect(controller.valueDefinitionsMap).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: { object: "Object" } },
      boolean: { type: "Boolean", default: true },
      array: { type: "Array", default: ["Array"] },
      number: { type: "Number", default: 1 },
    })
  })

  test("should handle syntax errors", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
    `

    const project = new Project(process.cwd())
    const sourceFile = new SourceFile(project, "error_controller.js", code)
    project.projectFiles.push(sourceFile)

    await project.analyze()

    expect(sourceFile.hasErrors).toBeTruthy()
    expect(sourceFile.errors).toHaveLength(1)
    expect(sourceFile.errors[0].message).toEqual("Error parsing controller: '}' expected.")
    expect(sourceFile.errors[0].cause.message).toEqual("'}' expected.")
    // expect(sourceFile.errors[0].loc.start.line).toEqual(9)
    // expect(sourceFile.errors[0].loc.end.line).toEqual(9)
  })

  test("parse arrow function", () => {
    const code = dedent`
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

    expect(controller.actionNames).toEqual(["connect", "load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse methods", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        load() {}
        unload() {}
      }
    `
    const controller = parseController(code, "controller.js")

    expect(controller.actionNames).toEqual(["load", "unload"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse private methods", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        #load() {}
      }
    `
    const controller = parseController(code, "controller.js")

    expect(controller.actionNames).toEqual(["#load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse nested object/array default value types", () => {
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

  test("parse controller with public class fields", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        instanceField
        instanceFieldWithInitializer = "instance field"
        static staticField
        static staticFieldWithInitializer = "static field"
      }
    `

    const controller = parseController(code, "controller.js")

    expect(controller.actionNames).toEqual([])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse controller with private getter", () => {
    const code = dedent`
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
    expect(controller.actionNames).toEqual([])
  })

  test("parse controller with private setter", () => {
    const code = dedent`
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
    expect(controller.actionNames).toEqual([])
  })

  test("parse controller with variable declaration in method body", () => {
    const code = dedent`
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
    expect(controller.actionNames).toEqual(["method"])
  })
})

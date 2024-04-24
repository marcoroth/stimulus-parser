import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"
import { extractLoc } from "../helpers/matchers"

import { Project } from "../../src/project"
import { SourceFile } from "../../src/source_file"

describe("with TS Syntax", () => {
  test("parse typescript code", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets: string[] = ["one", "two", "three"]

        hello(name: string): void {
          console.log("Hello, " + name);
        }
      }`

    const controller = parseController(code, "target_controller.js")

    expect(controller.targetNames).toEqual(["one", "two", "three"])
  })

  test("parse targets", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "two", "three"]

        declare readonly oneTarget: HTMLElement
        declare readonly twoTarget: HTMLElement
        declare readonly threeTarget: HTMLElement
      }
    `
    const controller = parseController(code, "target_controller.ts")

    expect(controller.targetNames).toEqual(["one", "two", "three"])
  })

  test("parse classes", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "class_controller.ts")

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

        declare stringValue: string
        declare objectValue: object
        declare booleanValue: boolean
        declare arrayValue: any[]
        declare numberValue: number
      }
    `
    const controller = parseController(code, "value_controller.ts")

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([8, 4, 8, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([8, 11, 8, 16])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([8, 11, 8, 16])
    expect(controller.valueDefinitionsMap.array.defaultValueLoc).toBeUndefined()
    expect(controller.valueDefinitionsMap.array.hasExplicitDefaultValue).toBeFalsy()
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: [],
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.boolean.keyLoc)).toEqual([7, 4, 7, 11])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.valueLoc)).toEqual([7, 13, 7, 20])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.typeLoc)).toEqual([7, 13, 7, 20])
    expect(controller.valueDefinitionsMap.boolean.defaultValueLoc).toBeUndefined()
    expect(controller.valueDefinitionsMap.boolean.hasExplicitDefaultValue).toBeFalsy()
    expect(controller.valueDefinitionsMap.boolean.definition).toEqual({
      type: "Boolean",
      default: false,
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([9, 4, 9, 10])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([9, 12, 9, 18])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([9, 12, 9, 18])
    expect(controller.valueDefinitionsMap.number.defaultValueLoc).toBeUndefined()
    expect(controller.valueDefinitionsMap.number.hasExplicitDefaultValue).toBeFalsy()
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 0,
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([6, 4, 6, 10])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([6, 12, 6, 18])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([6, 12, 6, 18])
    expect(controller.valueDefinitionsMap.object.defaultValueLoc).toBeUndefined()
    expect(controller.valueDefinitionsMap.object.hasExplicitDefaultValue).toBeFalsy()
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: {},
      kind: "shorthand",
    })

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([5, 4, 5, 10])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([5, 12, 5, 18])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([5, 12, 5, 18])
    expect(controller.valueDefinitionsMap.string.defaultValueLoc).toBeUndefined()
    expect(controller.valueDefinitionsMap.string.hasExplicitDefaultValue).toBeFalsy()
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

        declare stringValue: string
        declare objectValue: object
        declare booleanValue: boolean
        declare arrayValue: any[]
        declare numberValue: number
      }
    `
    const controller = parseController(code, "value_controller.ts")

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([8, 4, 8, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([8, 11, 8, 46])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([8, 19, 8, 24])
    expect(extractLoc(controller.valueDefinitionsMap.array.defaultValueLoc)).toEqual([8, 35, 8, 44])
    expect(controller.valueDefinitionsMap.array.hasExplicitDefaultValue).toBeTruthy()
    expect(controller.valueDefinitionsMap.array.definition).toEqual({
      type: "Array",
      default: ["Array"],
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.boolean.keyLoc)).toEqual([7, 4, 7, 11])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.valueLoc)).toEqual([7, 13, 7, 45])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.typeLoc)).toEqual([7, 21, 7, 28])
    expect(extractLoc(controller.valueDefinitionsMap.boolean.defaultValueLoc)).toEqual([7, 39, 7, 43])
    expect(controller.valueDefinitionsMap.boolean.hasExplicitDefaultValue).toBeTruthy()
    expect(controller.valueDefinitionsMap.boolean.definition).toEqual({
      type: "Boolean",
      default: true,
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.number.keyLoc)).toEqual([9, 4, 9, 10])
    expect(extractLoc(controller.valueDefinitionsMap.number.valueLoc)).toEqual([9, 12, 9, 40])
    expect(extractLoc(controller.valueDefinitionsMap.number.typeLoc)).toEqual([9, 20, 9, 26])
    expect(extractLoc(controller.valueDefinitionsMap.number.defaultValueLoc)).toEqual([9, 37, 9, 38])
    expect(controller.valueDefinitionsMap.number.hasExplicitDefaultValue).toBeTruthy()
    expect(controller.valueDefinitionsMap.number.definition).toEqual({
      type: "Number",
      default: 1,
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.object.keyLoc)).toEqual([6, 4, 6, 10])
    expect(extractLoc(controller.valueDefinitionsMap.object.valueLoc)).toEqual([6, 12, 6, 59])
    expect(extractLoc(controller.valueDefinitionsMap.object.typeLoc)).toEqual([6, 20, 6, 26])
    expect(extractLoc(controller.valueDefinitionsMap.object.defaultValueLoc)).toEqual([6, 37, 6, 57])
    expect(controller.valueDefinitionsMap.object.hasExplicitDefaultValue).toBeTruthy()
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: { object: "Object" },
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.string.keyLoc)).toEqual([5, 4, 5, 10])
    expect(extractLoc(controller.valueDefinitionsMap.string.valueLoc)).toEqual([5, 12, 5, 47])
    expect(extractLoc(controller.valueDefinitionsMap.string.typeLoc)).toEqual([5, 20, 5, 26])
    expect(extractLoc(controller.valueDefinitionsMap.string.defaultValueLoc)).toEqual([5, 37, 5, 45])
    expect(controller.valueDefinitionsMap.string.hasExplicitDefaultValue).toBeTruthy()
    expect(controller.valueDefinitionsMap.string.definition).toEqual({
      type: "String",
      default: "string",
      kind: "expanded",
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

    // expect(sourceFile.identifier).toEqual("error")
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
        connect(): void {
          document.addEventListener('event', this.load)
        }

        load = (event: Event):void => {}
      }
    `

    const controller = parseController(code, "controller.ts")

    expect(controller.actionNames).toEqual(["connect", "load"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse methods", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        load(): void {}

        unload(): void {}

        isSomething(): Boolean {}
      }
    `
    const controller = parseController(code, "controller.ts")

    expect(controller.actionNames).toEqual(["load", "unload", "isSomething"])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse private methods", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        #load() {}
        private unload() {}
      }
    `
    const controller = parseController(code, "controller.ts")

    expect(controller.actionNames).toEqual(["#load", "#unload"])
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
    expect(extractLoc(controller.valueDefinitionsMap.object.defaultValueLoc)).toEqual([5, 37, 5, 83])
    expect(controller.valueDefinitionsMap.object.hasExplicitDefaultValue).toBeTruthy()
    expect(controller.valueDefinitionsMap.object.definition).toEqual({
      type: "Object",
      default: { object: { some: { more: { levels: {} } } } },
      kind: "expanded",
    })

    expect(extractLoc(controller.valueDefinitionsMap.array.keyLoc)).toEqual([6, 4, 6, 9])
    expect(extractLoc(controller.valueDefinitionsMap.array.valueLoc)).toEqual([6, 11, 6, 80])
    expect(extractLoc(controller.valueDefinitionsMap.array.typeLoc)).toEqual([6, 19, 6, 24])
    expect(extractLoc(controller.valueDefinitionsMap.array.defaultValueLoc)).toEqual([6, 35, 6, 78])
    expect(controller.valueDefinitionsMap.array.hasExplicitDefaultValue).toBeTruthy()
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
        instanceField: any;
        instanceFieldWithInitializer: string = "instance field";
        static staticField: any;
        static staticFieldWithInitializer: string = "static field";
      }
    `

    const controller = parseController(code, "controller.ts")

    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse controller with private getter", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        private get privateGetter () {
          return true
        }
      }
    `

    const controller = parseController(code, "controller.ts")

    expect(controller.actionNames).toEqual([])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })

  test("parse controller with private setter", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        private set privateSetter (value) {
          // set
        }
      }
    `

    const controller = parseController(code, "controller.ts")

    expect(controller.actionNames).toEqual([])
    expect(controller.hasErrors).toBeFalsy()
    expect(controller.errors).toHaveLength(0)
  })
})

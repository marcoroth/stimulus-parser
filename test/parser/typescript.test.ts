import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"

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

    expect(controller.valueDefinitionsMap).toEqual({
      array: {
        type: "Array",
        default: [],
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

    expect(controller.valueDefinitionsMap).toEqual({
      string: { type: "String", default: "string", valueLoc: { end: { column: 26, line: 5 }, start: { column: 20, line: 5 } }, keyLoc: { end: { column: 18, line: 5 }, start: { column: 14, line: 5 } } },
      object: { type: "Object", default: { object: "Object" }, valueLoc: { end: { column: 26, line: 6 }, start: { column: 20, line: 6 } }, keyLoc: { end: { column: 18, line: 6 }, start: { column: 14, line: 6 } } },
      boolean: { type: "Boolean", default: true, valueLoc: { end: { column: 28, line: 7 }, start: { column: 21, line: 7 } }, keyLoc: { end: { column: 19, line: 7 }, start: { column: 15, line: 7 } } },
      array: { type: "Array", default: ["Array"], valueLoc: { end: { column: 24, line: 8 }, start: { column: 19, line: 8 } }, keyLoc: { end: { column: 17, line: 8 }, start: { column: 13, line: 8 } } },
      number: { type: "Number", default: 1, valueLoc: { end: { column: 26, line: 9 }, start: { column: 20, line: 9 } }, keyLoc: { end: { column: 18, line: 9 }, start: { column: 14, line: 9 } } },
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

    expect(controller.valueDefinitionsMap).toEqual({
      object: {
        type: "Object",
        default: { object: { some: { more: { levels: {} } } } },
        valueLoc: { end: { column: 26, line: 5 }, start: { column: 20, line: 5 } },
        keyLoc: { end: { column: 18, line: 5 }, start: { column: 14, line: 5 } }
      },
      array: {
        type: "Array",
        default: [["Array", "with", ["nested", ["values"]]]],
        valueLoc: { end: { column: 24, line: 6 }, start: { column: 19, line: 6 } },
        keyLoc: { end: { column: 17, line: 6 }, start: { column: 13, line: 6 } }
      },
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

import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"

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

    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "" },
      object: { type: "Object", default: {} },
      boolean: { type: "Boolean", default: false },
      array: { type: "Array", default: [] },
      number: { type: "Number", default: 0 },
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

    expect(controller.valueDefinitions).toEqual({
      string: { type: "String", default: "string" },
      object: { type: "Object", default: { object: "Object" } },
      boolean: { type: "Boolean", default: true },
      array: { type: "Array", default: ["Array"] },
      number: { type: "Number", default: 1 },
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

    expect(controller.valueDefinitions).toEqual({
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
    expect(sourceFile.errors[0].message).toEqual("Error parsing controller")
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

    expect(controller.methodNames).toEqual(["connect", "load"])
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

    expect(controller.methodNames).toEqual(["load", "unload"])
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

    expect(controller.methodNames).toEqual(["#load"])
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

    expect(controller.valueDefinitions).toEqual({
      object: { type: "Object", default: { object: { some: { more: { levels: {} } } } } },
      array: { type: "Array", default: [["Array", "with", ["nested", ["values"]]]] },
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

    expect(controller.methodNames).toEqual([])
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
    expect(controller.methodNames).toEqual([])
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
    expect(controller.methodNames).toEqual([])
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
    expect(controller.methodNames).toEqual(["method"])
  })
})

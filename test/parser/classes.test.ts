import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { parseController } from "../helpers/parse"

describe("parse classes", () => {
  test("static", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "two", "three"]
      }
    `

    const controller = parseController(code, "class_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.classNames).toEqual(["one", "two", "three"])
  })

  test("duplicate static classes", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "one", "three"]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.classNames).toEqual(["one", "one", "three"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus class "one"`)
    expect(controller.errors[0].loc.start.line).toEqual(4)
    expect(controller.errors[0].loc.start.column).toEqual(19)
    expect(controller.errors[0].loc.end.line).toEqual(4)
    expect(controller.errors[0].loc.end.column).toEqual(42)
  })

  test("single @Class decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Class, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Class private readonly randomClass!
      }
    `

    const controller = parseController(code, "class_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["random"])
  })

  test("single @Classes decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Classes, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Classes private readonly randomClasses: string[]
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["random"])
  })

  test("parse multiple class definitions", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Class, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Class private readonly oneClass!
        @Class private readonly twoClass!
      }
    `

    const controller = parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["one", "two"])
  })

  test("parse mix decorator and static definitions", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Class, Classes, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Class private readonly outputClass!: string;
        @Class private readonly nameClass!: string;
        @Classes private readonly itemClasses!: string[]

        static classes = ['one', 'two']
      }
    `

    const controller = parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["output", "name", "item", "one", "two"])
  })
})

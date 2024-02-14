import dedent from "dedent"
import { expect, test, describe } from "vitest"
import { parseController } from "../helpers/parse"

describe("decorator", () => {
  test("parse single target", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
      }
    `

    const controller = parseController(code, 'target_controller.js')
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targetNames).toEqual(['output'])
  })

  test("parse multiple target definitions", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
        @Target private readonly nameTarget!: HTMLInputElement;
      }
    `

    const controller = parseController(code, 'decorator_controller.js')
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targetNames).toEqual(['output', 'name'])
  })

  test("parse mix decorator and static definitions", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
        @Target private readonly nameTarget!: HTMLInputElement;

        static targets = ['one', 'two']
      }
    `

    const controller = parseController(code, 'decorator_controller.js')
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targetNames).toEqual(['output', 'name', 'one', 'two'])
  })

  test("adds error when decorator is used be controller is not decorated with @TypedController", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Target } from "@vytant/stimulus-decorators";

      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
      }
    `

    const controller = parseController(code, 'target_controller.js')
    expect(controller.isTyped).toBeFalsy()
    expect(controller.errors.length).toEqual(1)
    expect(controller.errors[0].message).toEqual("Controller needs to be decorated with @TypedController in order to use decorators.")
    expect(controller.errors[0].loc.start.line).toEqual(4)
    expect(controller.errors[0].loc.start.column).toEqual(15)
    expect(controller.errors[0].loc.end.line).toEqual(6)
    expect(controller.errors[0].loc.end.column).toEqual(1)
    expect(controller.targetNames).toEqual(['output'])
  })

  test("adds error when controller is decorated with @TypedController but no decorated in controller is used", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {}
    `

    const controller = parseController(code, 'target_controller.js')
    expect(controller.isTyped).toBeTruthy()
    expect(controller.errors.length).toEqual(1)
    expect(controller.errors[0].message).toEqual("Controller was decorated with @TypedController but Controller didn't use any decorators.")
    expect(controller.errors[0].loc.start.line).toEqual(5)
    expect(controller.errors[0].loc.start.column).toEqual(15)
    expect(controller.errors[0].loc.end.line).toEqual(5)
    expect(controller.errors[0].loc.end.column).toEqual(42)
  })
})

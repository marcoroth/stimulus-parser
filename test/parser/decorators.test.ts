import { expect, test, describe } from "vitest"
import { parseController } from "../helpers/parse"

describe("decorator", () => {
  test("parse single target", () => {
    const code = `
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
    const code = `
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
    const code = `
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
})

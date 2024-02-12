import { describe, expect, test } from "vitest"
import { parseController } from "../helpers/parse"

describe("parse targets", () => {
  test("static targets", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targets).toEqual(["one", "two", "three"])
  })

  test("duplicate static targets", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "one", "three"]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targets).toEqual(["one", "one", "three"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual("Duplicate definition of target:one")
    expect(controller.errors[0].loc.start.line).toEqual(5)
    expect(controller.errors[0].loc.end.line).toEqual(5)
  })

  test("single @Target decorator", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targets).toEqual(["output"])
  })

  test("duplicate @Target decorator", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
        @Target private readonly outputTarget!: HTMLDivElement;
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targets).toEqual(["output", "output"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual("Duplicate definition of target:output")
    expect(controller.errors[0].loc.start.line).toEqual(8)
    expect(controller.errors[0].loc.end.line).toEqual(8)
  })

  test("single @Targets decorator", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Targets, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Targets private readonly outputTargets!: HTMLDivElement[];
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targets).toEqual(["output"])
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

    const controller = parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targets).toEqual(["output", "name"])
  })

  test("parse mix decorator and static definitions", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
        @Target private readonly nameTarget!: HTMLInputElement;
        @Targets private readonly itemTargets!: HTMLDivElement[]

        static targets = ['one', 'two']
      }
    `

    const controller = parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targets).toEqual(["output", "name", "item", "one", "two"])
  })

  test("duplicate target in mix", () => {
    const code = `
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        static targets = ['output']

        @Target private readonly outputTarget!: HTMLDivElement;
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targets).toEqual(["output", "output"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual("Duplicate definition of target:output")
    expect(controller.errors[0].loc.start.line).toEqual(7)
    expect(controller.errors[0].loc.end.line).toEqual(7)
  })
})

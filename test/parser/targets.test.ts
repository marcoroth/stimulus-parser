import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"

describe("parse targets", () => {
  test("static targets", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "two", "three"]
      }
    `
    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "two", "three"])
  })

  test("duplicate static targets", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", "one", "three"]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "one", "three"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Target "one"`)
    expect(controller.errors[0].loc.start.line).toEqual(4)
    expect(controller.errors[0].loc.start.column).toEqual(27)
    expect(controller.errors[0].loc.end.line).toEqual(4)
    expect(controller.errors[0].loc.end.column).toEqual(32)
  })

  test("duplicate static targets from parent", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class Parent extends Controller {
        static targets = ["one"]
      }

      export default class Child extends Parent {
        static targets = ["one", "three"]
      }
    `

    const controller = parseController(code, "target_controller.js", "Child")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "three", "one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Target "one". A parent controller already defines this Target.`)
    expect(controller.errors[0].loc.start.line).toEqual(8)
    expect(controller.errors[0].loc.start.column).toEqual(20)
    expect(controller.errors[0].loc.end.line).toEqual(8)
    expect(controller.errors[0].loc.end.column).toEqual(25)
  })

  test("assigns targets outside of class via member expression", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class One extends Controller {}
      class Two extends Controller {}

      One.targets = ["one", "two"]
    `

    const one = parseController(code, "target_controller.js", "One")
    const two = parseController(code, "target_controller.js", "Two")

    expect(one.isTyped).toBeFalsy()
    expect(one.targetNames).toEqual(["one", "two"])
    expect(one.hasErrors).toBeFalsy()

    expect(two.isTyped).toBeFalsy()
    expect(two.targetNames).toEqual([])
    expect(two.hasErrors).toBeFalsy()
  })

  test("other literals are treated a strings in static targets array", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static targets = ["one", 1, 3.14, /something/, true, false, null, undefined]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "1", "3.14", "/something/", "true", "false", "null", "undefined"])
    expect(controller.hasErrors).toBeFalsy()
  })

  test.todo("variable reference in static targets array", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      const variable = "two"

      export default class extends Controller {
        static targets = ["one", variable]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "two"])
    expect(controller.hasErrors).toBeFalsy()
  })

  test.todo("trace variable reference in static targets array", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      const variable = "two"
      const another = variable

      export default class extends Controller {
        static targets = ["one", another]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "two"])
    expect(controller.hasErrors).toBeFalsy()
  })

  test.todo("trace static property literal reference in static targets array", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static property = "another"
        static targets = ["one", this.property]
      }
    `

    const controller = parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.targetNames).toEqual(["one", "two"])
    expect(controller.hasErrors).toBeFalsy()
  })

  test("single @Target decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Target, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Target private readonly outputTarget!: HTMLDivElement;
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targetNames).toEqual(["output"])
  })

  test("duplicate @Target decorator", () => {
    const code = dedent`
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
    expect(controller.targetNames).toEqual(["output", "output"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Target "output"`)
    expect(controller.errors[0].loc.start.line).toEqual(7)
    expect(controller.errors[0].loc.start.column).toEqual(2)
    expect(controller.errors[0].loc.end.line).toEqual(7)
    expect(controller.errors[0].loc.end.column).toEqual(57)
  })

  test("single @Targets decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Targets, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Targets private readonly outputTargets!: HTMLDivElement[];
      }
    `

    const controller = parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targetNames).toEqual(["output"])
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

    const controller = parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.targetNames).toEqual(["output", "name"])
  })

  test("parse mix decorator and static definitions", () => {
    const code = dedent`
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
    expect(controller.targetNames).toEqual(["output", "name", "item", "one", "two"])
  })

  test("duplicate target in mix", () => {
    const code = dedent`
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
    expect(controller.targetNames).toEqual(["output", "output"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Target "output"`)
    expect(controller.errors[0].loc.start.line).toEqual(6)
    expect(controller.errors[0].loc.start.column).toEqual(20)
    expect(controller.errors[0].loc.end.line).toEqual(6)
    expect(controller.errors[0].loc.end.column).toEqual(28)
  })
})

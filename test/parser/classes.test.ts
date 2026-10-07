import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"
import { extractLoc } from "../helpers/matchers"

describe("parse classes", () => {
  test("static", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "two", "three"]
      }
    `

    const controller = await parseController(code, "class_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.classNames).toEqual(["one", "two", "three"])
  })

  test("duplicate static classes", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static classes = ["one", "one", "three"]
      }
    `

    const controller = await parseController(code, "target_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.classNames).toEqual(["one", "one", "three"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Class "one"`)
    expect(extractLoc(controller.errors[0].loc)).toEqual([4, 27, 4, 32])
  })

  test("duplicate static classes from parent", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class Parent extends Controller {
        static classes = ["one"]
      }

      export default class Child extends Parent {
        static classes = ["one", "three"]
      }
    `

    const controller = await parseController(code, "target_controller.js", "Child")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.classNames).toEqual(["one", "three", "one"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Class "one". A parent controller already defines this Class.`)
    expect(extractLoc(controller.errors[0].loc)).toEqual([8, 20, 8, 25])
  })

  test("assigns classes outside of class via member expression", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class One extends Controller {}
      class Two extends Controller {}

      One.classes = ["one", "two"]
    `

    const one = await parseController(code, "classes_controller.js", "One")
    const two = await parseController(code, "classes_controller.js", "Two")

    expect(one.isTyped).toBeFalsy()
    expect(one.classNames).toEqual(["one", "two"])
    expect(one.hasErrors).toBeFalsy()

    expect(two.isTyped).toBeFalsy()
    expect(two.classNames).toEqual([])
    expect(two.hasErrors).toBeFalsy()
  })

  test("single @Class decorator", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Class, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Class private readonly randomClass!
      }
    `

    const controller = await parseController(code, "class_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["random"])
  })

  test("single @Classes decorator", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Classes, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Classes private readonly randomClasses: string[]
      }
    `

    const controller = await parseController(code, "target_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["random"])
  })

  test("parse multiple class definitions", async () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Class, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Class private readonly oneClass!
        @Class private readonly twoClass!
      }
    `

    const controller = await parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["one", "two"])
  })

  test("parse mix decorator and static definitions", async () => {
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

    const controller = await parseController(code, "decorator_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.classNames).toEqual(["output", "name", "item", "one", "two"])
  })
})

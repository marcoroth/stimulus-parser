import { describe, expect, test } from "vitest"
import { setupParserTest } from "./setup"

const parser = setupParserTest()

describe("parse classes", () => {
  test("static", () => {
    const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      static classes = ["one", "two", "three"]
    }
  `
    const controller = parser.parseController(code, "class_controller.js")

    expect(controller.classes).toEqual(["one", "two", "three"])
  })

  test("single @Class decorator", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Class, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Class private readonly randomClass!
  }`

    const controller = parser.parseController(code, "class_controller.js")

    expect(controller.classes).toEqual(["random"])
  })

  test("single @Classes decorator", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Classes, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Classes private readonly randomClasses: string[]
  }`

    const controller = parser.parseController(code, "target_controller.js")
    expect(controller.classes).toEqual(["random"])
  })

  test("parse multiple class definitions", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Class, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Class private readonly oneClass!
    @Class private readonly twoClass!
  }`

    const controller = parser.parseController(code, "decorator_controller.js")
    expect(controller.isTyped).toBeTruthy()

    expect(controller.classes).toEqual(["one", "two"])
  })

  test("parse mix decorator and static definitions", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Class, Classes, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Class private readonly outputClass!: string;
    @Class private readonly nameClass!: string;
    @Classes private readonly itemClasses!: string[]
    
    static classes = ['one', 'two']
  }`

    const controller = parser.parseController(code, "decorator_controller.js")
    expect(controller.isTyped).toBeTruthy()

    expect(controller.classes).toEqual(["output", "name", "item", "one", "two"])
  })
})

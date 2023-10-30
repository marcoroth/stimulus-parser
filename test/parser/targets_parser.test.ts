import { describe, expect, test } from "vitest"
import { setupParserTest } from "./setup"

const parser = setupParserTest()

describe("parse targets", () => {
  test("static targets", () => {
    const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      static targets = ["one", "two", "three"]
    }
  `
    const controller = parser.parseController(code, "target_controller.js")

    expect(controller.targets).toEqual(["one", "two", "three"])
  })

  test("single @Target decorator", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Target, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Target private readonly outputTarget!: HTMLDivElement;
  }`

    const controller = parser.parseController(code, "target_controller.js")
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targets).toEqual(["output"])
  })

  test("single @Targets decorator", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Targets, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Targets private readonly outputTargets!: HTMLDivElement[];
  }`

    const controller = parser.parseController(code, "target_controller.js")
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targets).toEqual(["output"])
  })

  test("parse multiple target defintions", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Target, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Target private readonly outputTarget!: HTMLDivElement;
    @Target private readonly nameTarget!: HTMLInputElement;
  }`

    const controller = parser.parseController(code, "decorator_controller.js")
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targets).toEqual(["output", "name"])
  })

  test("parse mix decorator and static defintions", () => {
    const code = `
  import { Controller } from "@hotwired/stimulus"
  import { Target, TypedController } from "@vytant/stimulus-decorators";

  @TypedController
  export default class extends Controller {
    @Target private readonly outputTarget!: HTMLDivElement;
    @Target private readonly nameTarget!: HTMLInputElement;
    @Targets private readonly itemTargets!: HTMLDivElement[]
    
    static targets = ['one', 'two']
  }`

    const controller = parser.parseController(code, "decorator_controller.js")
    expect(controller.isTyped).toBeTruthy()

    expect(controller.targets).toEqual(["output", "name", "item", "one", "two"])
  })
})

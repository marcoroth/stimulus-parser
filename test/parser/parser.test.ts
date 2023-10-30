import { expect, test, vi } from "vitest"
import { setupParserTest } from "./setup"

const parser = setupParserTest()

test("should handle syntax errors", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
  `
  const spy = vi.spyOn(console, "error")

  const controller = parser.parseController(code, "error_controller.js")

  expect(controller.identifier).toEqual("error")
  expect(controller.errors).toHaveLength(1)
  expect(controller.errors[0].message).toEqual("Error parsing controller")
  expect(controller.errors[0].cause.message).toEqual("Unexpected token (5:2)")

  expect(spy).toBeCalledWith("Error while parsing controller in 'error_controller.js': Unexpected token (5:2)")
})

test("parse arrow function", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      connect() {
        document.addEventListener('event', this.load)
      }

      load = (event) => {}
    }
  `

  const controller = parser.parseController(code, "controller.js")

  expect(controller.methods).toEqual(["connect", "load"])
  expect(controller.hasErrors).toBeFalsy()
})

test("parse private methods", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      #load() {}
    }
  `
  const controller = parser.parseController(code, "controller.js")

  expect(controller.methods).toEqual(["load"])
  expect(controller.hasErrors).toBeFalsy()
})

test("parse typescript code", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      static targets: string[] = ["one", "two", "three"]

      hello(name: string): void {
        console.log("Hello, " + name);
      }
    }`

  const controller = parser.parseController(code, "target_controller.js")

  expect(controller.targets).toEqual(["one", "two", "three"])
})

test("parse typescript private methods", () => {
  const code = `
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      private load() {}
    }
  `
  const controller = parser.parseController(code, "controller.js")

  expect(controller.methods).toEqual(["load"])
  expect(controller.hasErrors).toBeFalsy()
})

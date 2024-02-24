import { Controller } from "@hotwired/stimulus"

export class NonDefaultExportController extends Controller {}

export default class extends Controller {
  static targets = ["output"]

  static values = {
    message: { type: String, default: "Hello World" },
  }

  connect() {
    this.#updateElement(this.messageValue)
  }

  update({ params: { message } }) {
    this.#updateElement(message)
  }

  #updateElement(message) {
    this.outputTarget.textContent = message
  }
}

import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
    static values = {
        message: { type: String, default: 'Hello World!' },
    }

    static targets = ['output']

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

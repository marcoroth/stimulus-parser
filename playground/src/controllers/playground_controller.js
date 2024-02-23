import lz from "lz-string"
import dedent from "dedent"

import { Controller } from "@hotwired/stimulus"

const exampleController = dedent`
  import { Controller } from "@hotwired/stimulus"

  export default class extends Controller {
    static targets = ["name", "output"]

    greet() {
      this.outputTarget.textContent = \`Hello, \${this.nameTarget.value}!\`
    }
  }
`

export default class extends Controller {
  static targets = ["input", "simpleViewer", "fullViewer", "viewerButton"]

  connect() {
    this.restoreInput()
    this.analyze()
  }

  updateURL() {
    window.location.hash = this.compressedValue
  }

  async insert(event) {
    if (this.inputTarget.value !== "" && !confirm("Do you want to overwrite the current controller?")) {
      return
    }

    this.inputTarget.value = exampleController

    const button = this.getClosestButton(event.target)

    button.querySelector(".fa-file").classList.add("hidden")
    button.querySelector(".fa-circle-check").classList.remove("hidden")

    setTimeout(() => {
      button.querySelector(".fa-file").classList.remove("hidden")
      button.querySelector(".fa-circle-check").classList.add("hidden")
    }, 1000)
  }

  async share(event) {
    const button = this.getClosestButton(event.target)

    try {
      await navigator.clipboard.writeText(window.location.href)

      button.querySelector(".fa-circle-check").classList.remove("hidden")
    } catch (error) {
      button.querySelector(".fa-circle-xmark").classList.remove("hidden")
    }

    button.querySelector(".fa-copy").classList.add("hidden")

    setTimeout(() => {
      button.querySelector(".fa-copy").classList.remove("hidden")
      button.querySelector(".fa-circle-xmark").classList.add("hidden")
      button.querySelector(".fa-circle-check").classList.add("hidden")
    }, 1000)
  }

  restoreInput() {
    if (window.location.hash && this.inputTarget.value === "") {
      this.inputTarget.value = this.decompressedValue
    }
  }

  getClosestButton(element) {
    return (element instanceof HTMLButtonElement) ? element : element.closest("button")
  }

  selectViewer(event) {
    const button = this.getClosestButton(event.target)

    this.viewerButtonTargets.forEach(button => button.dataset.active = false)
    button.dataset.active = true

    if (button.dataset.viewer === "simple") {
      this.simpleViewerTarget.classList.remove("hidden")
      this.fullViewerTarget.classList.add("hidden")
    } else {
      this.simpleViewerTarget.classList.add("hidden")
      this.fullViewerTarget.classList.remove("hidden")
    }
  }

  async analyze(){
    this.updateURL()

    let response
    let json

    try {
      response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          controller: this.inputTarget.value
        })
      })
    } catch(error) {
      this.simpleViewerTarget.data = { error: error, message: error.message }
      this.fullViewerTarger.data = { error: error, message: error.message }
    }

    if (response.ok) {
      try {
        json = await response.json()

        if (this.hasSimpleViewerTarget) {
          const isEmpty = !this.simpleViewerTarget.data

          this.simpleViewerTarget.data = { sourceFile: json.simple }

          if (isEmpty) {
            if (json.simple.errors.length > 0) {
              this.simpleViewerTarget.expand("sourceFile.errors")
            } else if (json.simple.controllerDefinitions.length > 0) {
              this.simpleViewerTarget.expand("sourceFile.controllerDefinitions.*")
            } else if (json.simple.classDeclarations.length > 0) {
              this.simpleViewerTarget.expand("sourceFile.classDeclarations")
            } else {
              this.simpleViewerTarget.expand("sourceFile")
            }
          }
        }

        if (this.hasFullViewerTarget) {
          const isEmpty = !this.fullViewerTarget.data

          this.fullViewerTarget.data = { sourceFile: json.full }

          if (isEmpty) {
            if (json.full.errors.length > 0) {
              this.fullViewerTarget.expand("sourceFile.errors")
            } else if (json.full.classDeclarations.length > 0) {
              this.fullViewerTarget.expand("sourceFile.classDeclarations")
            } else {
              this.fullViewerTarget.expand("sourceFile")
            }
          }
        }
      } catch (error) {
        this.simpleViewerTarget.data = { error: "Server didn't return JSON", response: error.message }
        this.fullViewerTarget.data = { error: "Server didn't return JSON", response: error.message }
      }
    } else {
      this.simpleViewerTarget.data = { error: "Server didn't respond with a 200 response" }
      this.fullViewerTarget.data = { error: "Server didn't respond with a 200 response" }
    }
  }

  get compressedValue() {
    return lz.compressToEncodedURIComponent(this.inputTarget.value)
  }

  get decompressedValue() {
    return lz.decompressFromEncodedURIComponent(window.location.hash.slice(1))
  }
}

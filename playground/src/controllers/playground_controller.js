import dedent from "dedent"
import { Controller } from "@hotwired/stimulus"

import lz from "lz-string"

const exampleController = dedent`
  import { Controller } from "@hotwired/stimulus"

  export default class extends Controller {
    static targets = [ "name", "output" ]

    greet() {
      this.outputTarget.textContent = \`Hello, \${this.nameTarget.value}!\`
    }
  }
`

export default class extends Controller {
  static targets = ["input", "viewer"]

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

    const button = (event.target instanceof HTMLButtonElement) ? event.target : event.target.closest("button")

    button.querySelector(".fa-file").classList.add("hidden")
    button.querySelector(".fa-circle-check").classList.remove("hidden")

    setTimeout(() => {
      button.querySelector(".fa-file").classList.remove("hidden")
      button.querySelector(".fa-circle-check").classList.add("hidden")
    }, 1000)
  }

  async share(event) {
    const button = (event.target instanceof HTMLButtonElement) ? event.target : event.target.closest("button")

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

  async analyze(){
    this.updateURL()

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        controller: this.inputTarget.value
      })
    })

    const json = await response.json()

    if (this.hasViewerTarget) {
      this.viewerTarget.data = { sourceFile: json }

      if (json.errors.length > 0) {
        this.viewerTarget.expand("sourceFile.errors")
      } else if (json.controllerDefinitions.length > 0) {
        this.viewerTarget.expand("sourceFile.controllerDefinitions.*")
      } else if (json.classDeclarations.length > 0) {
        this.viewerTarget.expand("sourceFile.classDeclarations")
      } else {
        this.viewerTarget.expand("sourceFile")
      }
    }
  }

  get compressedValue() {
    return lz.compressToEncodedURIComponent(this.inputTarget.value)
  }

  get decompressedValue() {
    return lz.decompressFromEncodedURIComponent(window.location.hash.slice(1))
  }
}

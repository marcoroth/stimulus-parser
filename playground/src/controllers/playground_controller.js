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

  insert() {
    this.inputTarget.value = exampleController
  }

  updateURL() {
    window.location.hash = this.compressedValue
    window.history.pushState({}, "", window.location.href)
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

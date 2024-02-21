import "@alenaksu/json-viewer"
import "./style.css"

import dedent from "dedent"

const input = document.querySelector<HTMLTextAreaElement>("#input")
const example = document.querySelector<HTMLButtonElement>("#example")

async function analyze(){
  if (!input) return

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      controller: input.value
    })
  })

  const json = await response.json()
  const viewer = document.querySelector("json-viewer")

  if (viewer) {
    viewer.data = { sourceFile: json }

    if (json.errors.length > 0) {
      viewer.expand("sourceFile.errors")
    } else if (json.controllerDefinitions.length > 0) {
      viewer.expand("sourceFile.controllerDefinitions.*")
    } else if (json.classDeclarations.length > 0) {
      viewer.expand("sourceFile.classDeclarations")
    } else {
      viewer.expand("sourceFile")
    }
  }
}

function insertExample() {
  if (!input) return

  input.value = dedent`
    import { Controller } from "@hotwired/stimulus"

    export default class extends Controller {
      static targets = [ "name", "output" ]

      greet() {
        this.outputTarget.textContent = \`Hello, \${this.nameTarget.value}!\`
      }
    }
  `

  analyze()
}

if (input) {
  input.addEventListener("change", () => analyze())
  input.addEventListener("keyup", () => analyze())
}

if (example) {
  example.addEventListener("click", () => insertExample())
}

analyze()

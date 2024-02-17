import { Controller } from "@hotwired/stimulus"
import { Modal } from "tailwindcss-stimulus-components"
// import { Target, TypedController } from "@vytant/stimulus-decorators";

// @TypedController
export default class extends Controller {
  // @Target private readonly outputTarget!: HTMLDivElement;

  static targets = ["output", "output"];
  static classes = ["active", "active"];

  static otherValues = {
    name: String,
  }

  static values = {
    ...this.otherValues,
    name: String,
  }
}

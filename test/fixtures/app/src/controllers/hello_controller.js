import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
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

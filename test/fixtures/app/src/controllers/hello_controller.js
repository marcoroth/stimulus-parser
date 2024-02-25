import { Controller } from "@hotwired/stimulus"

class ParentController extends Controller {}

export default class extends ParentController {
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

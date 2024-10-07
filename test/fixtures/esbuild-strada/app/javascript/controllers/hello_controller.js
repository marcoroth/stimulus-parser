import { Controller } from "@hotwired/stimulus"

export class NonDefaultExportController extends Controller {}

export default class extends Controller {
  static targets = ["name", "output"];

  connect() {

  }
}

import { Controller } from "@hotwired/stimulus"
const x: number = 1;

export default class extends Controller {
  declare x: number

  connect(): void {
    this.x = x
  }

  private method() {
    // private
  }
}

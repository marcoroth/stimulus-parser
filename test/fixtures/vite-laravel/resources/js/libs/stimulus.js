import { Application } from "@hotwired/stimulus"

const Stimulus = Application.start()

// Configure Stimulus development experience
Stimulus.debug = false

export { Stimulus }

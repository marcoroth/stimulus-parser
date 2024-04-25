import { Application as MyApplication } from "@hotwired/stimulus"

const application = MyApplication.start()

// Configure Stimulus development experience
application.debug = false
window.Stimulus   = application

const abc = 1

export { abc }
export { application as StimulusApplication }

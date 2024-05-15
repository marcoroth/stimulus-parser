import { Application } from "@hotwired/stimulus"
import { definitionsFromContext } from "@hotwired/stimulus-webpack-helpers"

const application = Application.start(document.documentElement);

const context = require.context('./controllers', true, /_controller\.ts$/)
application.load(definitionsFromContext(context))

window.Stimulus = application

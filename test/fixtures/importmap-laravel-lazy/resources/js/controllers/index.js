import { Stimulus } from "libs/stimulus"

// Eager load all controllers defined in the import map under controllers/**/*_controller
import { lazyLoadControllersFrom } from "@hotwired/stimulus-loading"
lazyLoadControllersFrom("controllers", Stimulus)

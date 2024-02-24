import { application } from "./application"

import HelloController from "./hello_controller"
application.register("hello", HelloController)

import CustomModal from "./custom_modal_controller"
application.register("custom-modal", CustomModal)

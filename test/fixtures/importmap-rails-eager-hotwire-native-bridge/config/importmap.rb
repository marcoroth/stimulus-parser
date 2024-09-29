# Pin npm packages by running ./bin/importmap

pin "application"

pin "application", preload: true
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin "@hotwired/hotwire-native-bridge", to: "@hotwired--hotwire-native-bridge.js" # @1.0.0

pin_all_from "app/javascript/controllers", under: "controllers"

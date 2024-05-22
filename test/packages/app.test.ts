import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

let project = setupProject("app")

describe("packages", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  describe("app", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.initialize()

      expect(Array.from(project.referencedNodeModules).sort()).toEqual([
        "@hotwired/stimulus",
        "tailwindcss-stimulus-components"
      ])

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual(["tailwindcss-stimulus-components"])
      expect(Array.from(project.controllerRoots).sort()).toEqual(["src/controllers"])
      expect(project.guessedControllerRoots).toEqual([
        "src/controllers",
        "node_modules/tailwindcss-stimulus-components/src",
      ])

      const exportedIdentifiers = [
        "alert",
        "autosave",
        "color-preview",
        "custom-modal",
        "dropdown",
        "hello",
        "modal",
        "parent",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ]

      expect(project.registeredControllers.map(controller => controller.identifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      await project.refresh()

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(controller.valueNames).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitionsMap.open.type).toEqual("Boolean")
      expect(controller.valueDefinitionsMap.restoreScroll.type).toEqual("Boolean")

      const sourceFileCount = project.projectFiles.length
      const allSourceFileCount = project.allSourceFiles.length

      expect(sourceFileCount).toEqual(4)
      expect(allSourceFileCount).toEqual(15)

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(sourceFileCount)
      expect(project.allSourceFiles.length).toEqual(allSourceFileCount)
      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)
    })

    test("detect all controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.initialize()
      await project.detectAvailablePackages()

      expect(Array.from(project.referencedNodeModules).sort()).toEqual([
        "@hotwired/stimulus",
        "tailwindcss-stimulus-components",
      ])

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual([
        "@stimulus-library/controllers",
        "@stimulus-library/mixins",
        "@stimulus-library/utilities",
        "@vytant/stimulus-decorators",
        "stimulus-checkbox",
        "stimulus-clipboard",
        "stimulus-datepicker",
        "stimulus-dropdown",
        "stimulus-hotkeys",
        "stimulus-inline-input-validations",
        "stimulus-use",
        "tailwindcss-stimulus-components",
      ])

      expect(Array.from(project.controllerRoots).sort()).toEqual(["src/controllers"])

      expect(project.guessedControllerRoots).toEqual([
        "src/controllers",
        "node_modules/tailwindcss-stimulus-components/src",
      ])

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "custom-modal",
        "dropdown",
        "hello",
        "modal",
        "parent",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ])

      await project.analyzeAllDetectedModules()

      const allIdentifiers = [
        "alert",
        "alert",
        "anchor-spy",
        "application",
        "async-block",
        "auto-submit-form",
        "autosave",
        "autosize",
        "back-link",
        "base",
        "base",
        "char-count",
        "checkbox",
        "checkbox-disable-inputs",
        "checkbox-enable-inputs",
        "checkbox-select-all",
        "checkbox-xor",
        "click-outside",
        "click-outside-composable",
        "clipboard",
        "clipboard",
        "clock",
        "color-preview",
        "confirm",
        "confirm-navigation",
        "countdown",
        "custom-modal",
        "datepicker",
        "debounce",
        "debug",
        "detect-dirty",
        "detect-dirty-form",
        "disable-with",
        "dismissable",
        "dropdown",
        "dropdown",
        "duration",
        "element-save",
        "empty-dom",
        "enable-inputs",
        "ephemeral",
        "equalize",
        "fallback-image",
        "focus-steal",
        "form-dirty-confirm-navigation",
        "form-rc",
        "form-save",
        "fullscreen",
        "hello",
        "hotkeys",
        "hover",
        "hover-composable",
        "idle",
        "idle-composable",
        "input-validator",
        "install-class-methods",
        "intersection",
        "intersection",
        "intersection-composable",
        "interval",
        "lazy-block",
        "lazy-load",
        "lazy-load-composable",
        "lightbox-image",
        "limited-selection-checkboxes",
        "load-block",
        "media-player",
        "modal",
        "mutation",
        "mutation-composable",
        "navigate-form-errors",
        "nested-form",
        "parent",
        "password-confirm",
        "password-peek",
        "persisted-dismissable",
        "persisted-remove",
        "poll-block",
        "popover",
        "prefetch",
        "presence",
        "print",
        "print-button",
        "refresh-page",
        "remote-form",
        "remove",
        "resize",
        "resize-composable",
        "responsive-iframe-body",
        "responsive-iframe-wrapper",
        "scroll-container",
        "scroll-into-focus",
        "scroll-to",
        "scroll-to-bottom",
        "scroll-to-top",
        "self-destruct",
        "signal-action",
        "signal-disable",
        "signal-dom-children",
        "signal-enable",
        "signal-input",
        "signal-visibility",
        "slideover",
        "sticky",
        "sync-inputs",
        "table-sort",
        "table-truncate",
        "tabs",
        "tabs",
        "target-mutation",
        "target-mutation-composable",
        "teleport",
        "temporary-state",
        "throttle",
        "time-distance",
        "timeout",
        "toggle",
        "toggle-class",
        "transition",
        "transition-composable",
        "tree-view",
        "trix-modifier",
        "turbo-frame-history",
        "turbo-frame-rc",
        "turbo-frame-refresh",
        "tween-number",
        "use-trix-modifiers",
        "user-focus",
        "value-warn",
        "visibility",
        "visibility-composable",
        "window-focus",
        "window-focus-composable",
        "window-resize",
        "window-resize-composable",
        "word-count",
      ]

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.guessedIdentifier).sort()).toEqual(allIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(controller.valueNames).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitionsMap.open.type).toEqual("Boolean")
      expect(controller.valueDefinitionsMap.restoreScroll.type).toEqual("Boolean")

      expect(project.projectFiles.length).toEqual(4)
      expect(project.allSourceFiles.length).toEqual(168)
      const allSourceFiles = project.allSourceFiles.map(s => s.path).sort()

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(allIdentifiers)

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(4)
      expect(project.allSourceFiles.length).toEqual(168)
      expect(project.allSourceFiles.map(s => s.path).sort()).toEqual(allSourceFiles)

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
    })
  })
})

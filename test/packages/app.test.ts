import { describe, test, expect } from "vitest"
import { Project } from "../../src"

const project = new Project(`${process.cwd()}/test/fixtures/app`)

describe("packages", () => {
  describe("app", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.analyze()

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

      expect(project.controllerRoots).toEqual([
        "src/controllers",
        "node_modules/@stimulus-library/controllers",
        "node_modules/stimulus-checkbox/src",
        "node_modules/stimulus-clipboard/dist",
        "node_modules/stimulus-datepicker/src",
        "node_modules/stimulus-dropdown/dist",
        "node_modules/stimulus-hotkeys/src",
        "node_modules/stimulus-inline-input-validations/src",
        "node_modules/stimulus-use/dist",
        "node_modules/tailwindcss-stimulus-components/src",
        "node_modules/@stimulus-library/mixins/dist",
        "node_modules/@stimulus-library/utilities/dist",
      ])

      const expectedIdentifiers = [
        "alert",
        "application",
        "autosave",
        "base",
        "click-outside",
        "click-outside-composable",
        "color-preview",
        "datepicker",
        "debounce",
        "dropdown",
        "hello",
        "hover",
        "hover-composable",
        "idle",
        "idle-composable",
        "index",
        "index",
        "input-validator",
        "install-class-methods",
        "intersection",
        "intersection-composable",
        "lazy-load",
        "lazy-load-composable",
        "modal",
        "mutation",
        "mutation-composable",
        "popover",
        // "slideover", // TODO: this isn't supported yet since this uses an inherited class from another file
        "resize",
        "resize-composable",
        "stimulus-clipboard",
        "stimulus-dropdown",
        "tabs",
        "target-mutation",
        "target-mutation-composable",
        "throttle",
        "toggle",
        "transition",
        "transition-composable",
        "use-trix-modifiers",
        "visibility",
        "visibility-composable",
        "window-focus",
        "window-focus-composable",
        "window-resize",
        "window-resize-composable",
      ]

      const sourceFileCount = project.sourceFiles.length

      expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual(expectedIdentifiers)

      const controller = project.controllerDefinitions.find(controller => controller.identifier === "modal")

      expect(controller.targetNames).toEqual(["container", "background"])
      expect(Object.keys(controller.valueDefinitions)).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitions.open.type).toEqual("Boolean")
      expect(controller.valueDefinitions.restoreScroll.type).toEqual("Boolean")

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.sourceFiles.length).toEqual(sourceFileCount)
      expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual(expectedIdentifiers)
    })
  })
})

import { describe, test, expect } from "vitest"
import { Project } from "../../src"

const project = new Project(`${process.cwd()}/test/fixtures/packages/app`)

describe("packages", () => {
  describe("app", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.analyze()

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual([
        "@stimulus-library/controllers",
        "@stimulus-library/mixins",
        "@stimulus-library/utilities",
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

      // expect(project.controllerDefinitions.length).toEqual(11)
      // expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual([
      //   "alert",
      //   "autosave",
      //   "color-preview",
      //   "datepicker",
      //   "dropdown",
      //   "index",
      //   "input-validator",
      //   "iso-date",
      //   "modal",
      //   "popover",
      //   "slideover",
      //   "tabs",
      //   "toggle",
      //   "transition",
      // ])

      const controller = project.controllerDefinitions.find(controller => controller.identifier === "modal")

      expect(controller.targetNames).toEqual(["container", "background"])
      expect(Object.keys(controller.valueDefinitions)).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitions.open.type).toEqual("Boolean")
      expect(controller.valueDefinitions.restoreScroll.type).toEqual("Boolean")
    })
  })
})

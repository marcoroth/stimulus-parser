import { describe, test, expect } from "vitest"
import { Project } from "../../src"

const project = new Project(`${process.cwd()}/test/fixtures/packages/tailwindcss-stimulus-components`)

describe("packages", () => {
  describe("tailwindcss-stimulus-components", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.analyze()

      expect(project.detectedNodeModules.map(module => module.name)).toEqual(["tailwindcss-stimulus-components"])
      expect(project.controllerRoots).toEqual(["node_modules/tailwindcss-stimulus-components/src"])
      expect(project.controllerDefinitions.length).toEqual(11)
      expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "dropdown",
        "index",
        "modal",
        "popover",
        "slideover",
        "tabs",
        "toggle",
        "transition",
      ])

      const controller = project.controllerDefinitions.find(controller => controller.identifier === "modal")

      expect(controller.targets).toEqual(["container", "background"])
      expect(Object.keys(controller.values)).toEqual(["open", "restoreScroll"])
      expect(controller.values.open.type).toEqual("Boolean")
      expect(controller.values.restoreScroll.type).toEqual("Boolean")
    })
  })
})

import { describe, test, expect } from "vitest"
import { Project } from "../../src"

const project = new Project(`${process.cwd()}/test/fixtures/app`)

describe("packages", () => {
  describe("app", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.analyze()

      expect(project.referencedNodeModules.sort()).toEqual([
        "@hotwired/stimulus",
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

      expect(project.controllerRoots).toEqual([
        "src/controllers",
      ])

      expect(project.allControllerRoots).toEqual([
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

      const exportedIdentifiers = [
        "alert",
        "application",
        "autosave",
        "base",
        "click-outside",
        "color-preview",
        "datepicker",
        "dropdown",
        "hello",
        "hover",
        "idle",
        "index",
        "index",
        "input-validator",
        "install-class-methods",
        "intersection",
        "lazy-load",
        "modal",
        "mutation",
        "popover",
        // "slideover", // TODO: this isn't supported yet since this uses an inherited class from another file
        "resize",
        "stimulus-clipboard",
        "stimulus-dropdown",
        "tabs",
        "target-mutation",
        "toggle",
        "transition",
        "use-trix-modifiers",
        "visibility",
        "window-focus",
        "window-resize",
      ]

      expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual(["hello"])
      expect(project.allControllerDefinitions.map(controller => controller.identifier).sort()).toEqual(["hello"])

      await project.analyzeAllDetectedModules()

      expect(project.allControllerDefinitions.map(controller => controller.identifier).sort()).toEqual(exportedIdentifiers)

      const allIdentifiers = [
        ...exportedIdentifiers,
        "click-outside-composable",
        "debounce",
        "hover-composable",
        "idle-composable",
        "intersection-composable",
        "lazy-load-composable",
        "mutation-composable",
        "resize-composable",
        "target-mutation-composable",
        "throttle",
        "transition-composable",
        "visibility-composable",
        "window-focus-composable",
        "window-resize-composable",
      ].sort()


      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.identifier).sort()).toEqual(allIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.identifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(Object.keys(controller.valueDefinitions)).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitions.open.type).toEqual("Boolean")
      expect(controller.valueDefinitions.restoreScroll.type).toEqual("Boolean")

      const sourceFileCount = project.projectFiles.length
      const allSourceFileCount = project.allSourceFiles.length

      expect(sourceFileCount).toEqual(1)
      expect(allSourceFileCount).toEqual(165)

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.identifier).sort()).toEqual(["hello"])

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(sourceFileCount)
      expect(project.allSourceFiles.length).toEqual(allSourceFileCount)
      expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual(["hello"])
      expect(project.allControllerDefinitions.map(controller => controller.identifier).sort()).toEqual(exportedIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.identifier).sort()).toEqual(allIdentifiers)
    }, 10_000)
  })
})

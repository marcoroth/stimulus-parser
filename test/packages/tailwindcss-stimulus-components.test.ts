import { describe, test, expect } from "vitest"
import { Project } from "../../src"

const project = new Project(`${process.cwd()}/test/fixtures/packages/tailwindcss-stimulus-components`)

describe("packages", () => {
  describe("tailwindcss-stimulus-components", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.analyze()

      expect(project.detectedNodeModules.map(module => module.name)).toEqual(["tailwindcss-stimulus-components"])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
      expect(project.allControllerRoots).toEqual(["node_modules/tailwindcss-stimulus-components/src"])
      expect(project.controllerDefinitions.map(controller => controller.identifier).sort()).toEqual([])

      expect(project.allControllerDefinitions.map(controller => controller.identifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "dropdown",
        "modal",
        "popover",
        // "slideover", // TODO: this isn't supported yet since this uses an inherited class from another file
        "tabs",
        "toggle",
      ])

      const modalController = project.allControllerDefinitions.find(controller => controller.identifier === "modal")

      expect(modalController.targetNames).toEqual(["container", "background"])
      expect(Object.keys(modalController.valueDefinitions)).toEqual(["open", "restoreScroll"])
      expect(modalController.valueDefinitions.open.type).toEqual("Boolean")
      expect(modalController.valueDefinitions.restoreScroll.type).toEqual("Boolean")
      expect(modalController.classDeclaration.superClass.className).toEqual("Controller")
      expect(modalController.classDeclaration.superClass.isStimulusDescendant).toEqual(true)
      expect(modalController.classDeclaration.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
      expect(modalController.classDeclaration.superClass.importDeclaration.localName).toEqual("Controller")
      expect(modalController.classDeclaration.superClass.importDeclaration.originalName).toEqual("Controller")
      expect(modalController.classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(true)

      // TODO: uncomment once we support detecting imports from other files
      // const slideoverSontroller = project.controllerDefinitions.find(controller => controller.identifier === "slideover")
      //
      // expect(slideoverSontroller.targetNames).toEqual(["menu", "overlay", "close"])
      // expect(slideoverSontroller.valueDefinitions).toEqual({})
      // expect(slideoverSontroller.classDeclaration.superClass.className).toEqual("Dropdown")
      // expect(slideoverSontroller.classDeclaration.superClass.isStimulusDescendant).toEqual(true)
      // expect(slideoverSontroller.classDeclaration.superClass.importDeclaration.source).toEqual("./dropdown.js")
      // expect(slideoverSontroller.classDeclaration.superClass.importDeclaration.localName).toEqual("Dropdown")
      // expect(slideoverSontroller.classDeclaration.superClass.importDeclaration.originalName).toEqual(undefined)
      // expect(slideoverSontroller.classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(false)
    })
  })
})

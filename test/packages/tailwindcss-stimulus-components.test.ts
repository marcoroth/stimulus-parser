import { describe, test, expect } from "vitest"
import { Project, StimulusControllerClassDeclaration } from "../../src"

const project = new Project(`${process.cwd()}/test/fixtures/packages/tailwindcss-stimulus-components`)

describe("packages", () => {
  describe("tailwindcss-stimulus-components", () => {

    // this test is flaky, sometimes we slideover controller is actually present
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.initialize()

      expect(project.detectedNodeModules.map(module => module.name)).toEqual(["tailwindcss-stimulus-components"])
      expect(Array.from(project.controllerRoots).sort()).toEqual([])
      expect(project.guessedControllerRoots).toEqual([
        "app/javascript/controllers",
        "node_modules/tailwindcss-stimulus-components/src",
      ])
      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["hello"])

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "dropdown",
        "hello",
        "modal",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ])

      const modalController = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")

      expect(modalController.targetNames).toEqual(["container", "background"])
      expect(modalController.valueNames).toEqual(["open", "restoreScroll"])
      expect(modalController.valueDefinitionsMap.open.type).toEqual("Boolean")
      expect(modalController.valueDefinitionsMap.restoreScroll.type).toEqual("Boolean")
      expect(modalController.classDeclaration.superClass).toBeDefined()
      expect(modalController.classDeclaration.superClass.className).toEqual("Controller")
      expect(modalController.classDeclaration.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
      expect(modalController.classDeclaration.superClass.isStimulusClassDeclaration).toEqual(true)
      expect(modalController.classDeclaration.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
      expect(modalController.classDeclaration.superClass.importDeclaration.localName).toEqual("Controller")
      expect(modalController.classDeclaration.superClass.importDeclaration.originalName).toEqual("Controller")
      expect(modalController.classDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(true)

      const slideoverSontroller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "slideover")

      expect(slideoverSontroller.targetNames).toEqual(["menu", "overlay", "close", "menu", "button", "menuItem"])
      expect(slideoverSontroller.valueNames).toEqual(["open"])
      expect(slideoverSontroller.classDeclaration.superClass.className).toEqual(undefined)
      expect(slideoverSontroller.classDeclaration.superClass.isStimulusDescendant).toEqual(true)
      expect(slideoverSontroller.classDeclaration.superClass.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })
  })
})

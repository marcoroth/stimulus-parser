import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

describe("Project", () => {
  describe("RegisteredController", () => {
    test("finds registered controllers for webpacker", async () => {
      const project = setupProject("webpacker")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-webpack-helpers"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test("finds registered controllers for shakapacker", async () => {
      const project = setupProject("shakapacker")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-webpack-helpers"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test("finds registered controllers for esbuild-rails", async () => {
      const project = setupProject("esbuild-rails")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "esbuild-rails"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test("finds registered controllers for esbuild", async () => {
      const project = setupProject("esbuild")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "register"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test("finds registered controllers for vite-rails", async () => {
      const project = setupProject("vite-rails")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-vite-helpers"]])
      expect(project.controllerRoots).toEqual(["app/frontend/controllers"])
    }, 15_000)

    test.todo("finds registered controllers for bun", async () => {
      const project = setupProject("bun")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "register"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test("finds registered controllers for importmap-rails lazy", async () => {
      const project = setupProject("importmap-rails-lazy")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-loading-lazy"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test("finds registered controllers for importmap-rails eager", async () => {
      const project = setupProject("importmap-rails-eager")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-loading-eager"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })

    test.todo("finds registered controllers for rollup", async () => {
      const project = setupProject("rollup")

      expect(project.registeredControllers.length).toEqual(0)

      await project.initialize()

      expect(project.registeredControllers.length).toEqual(1)
      expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "register"]])
      expect(project.controllerRoots).toEqual(["app/javascript/controllers"])
    })
  })
})

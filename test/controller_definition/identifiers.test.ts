import { describe, beforeEach, test, expect } from "vitest"
import { ControllerDefinition } from "../../src"
import { setupProject, classDeclarationFor } from "../helpers/setup"

let project = setupProject()

describe("ControllerDefinition", () => {
  beforeEach(() => {
    project = project = setupProject()
  })

  describe("guessedIdentifier", () => {
    test("top-level", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some_controller.js"))

      expect(controller.guessedIdentifier).toEqual("some")
    })

    test("top-level underscored", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some_underscored_controller.js"))

      expect(controller.guessedIdentifier).toEqual("some-underscored")
    })

    test("top-level dasherized", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some-underscored_controller.js"))

      expect(controller.guessedIdentifier).toEqual("some-underscored")
    })

    test("namespaced", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/namespaced/some_controller.js"))

      expect(controller.guessedIdentifier).toEqual("namespaced--some")
    })

    test("deeply nested", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/some_controller.js"))

      expect(controller.guessedIdentifier).toEqual("a--bunch--of--levels--some")
    })

    test("deeply nested underscored", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/some_underscored_controller.js"))

      expect(controller.guessedIdentifier).toEqual("a--bunch--of--levels--some-underscored")
    })

    test("deeply nested dasherized", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/some-underscored_controller.js"))

      expect(controller.guessedIdentifier).toEqual("a--bunch--of--levels--some-underscored")
    })

    test("deeply nested all dasherized", async () => {
      const controller = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/some-underscored-controller.js"))

      expect(controller.guessedIdentifier).toEqual("a--bunch--of--levels--some-underscored")
    })

    // TODO: update implementation once this gets released
    // https://github.com/hotwired/stimulus-webpack-helpers/pull/3
    test("nested with only controller", async () => {
      const controller1 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/controller.js"))
      const controller2 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/controller.ts"))

      expect(controller1.guessedIdentifier).toEqual("a--bunch--of--levels")
      expect(controller2.guessedIdentifier).toEqual("a--bunch--of--levels")
    })

    test("without controller suffix", async () => {
      const controller1 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/something.js"))
      const controller2 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/something.ts"))

      expect(controller1.guessedIdentifier).toEqual("something")
      expect(controller2.guessedIdentifier).toEqual("something")
    })

    test("nested without controller suffix", async () => {
      const controller1 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/something.js"))
      const controller2 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch/of/levels/something.ts"))

      expect(controller1.guessedIdentifier).toEqual("a--bunch--of--levels--something")
      expect(controller2.guessedIdentifier).toEqual("a--bunch--of--levels--something")
    })

    test("controller with dashes and underscores", async () => {
      const controller1 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some-thing_controller.js"))
      const controller2 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some-thing_controller.ts"))
      const controller3 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some_thing-controller.js"))
      const controller4 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some_thing-controller.ts"))

      expect(controller1.guessedIdentifier).toEqual("some-thing")
      expect(controller2.guessedIdentifier).toEqual("some-thing")
      expect(controller3.guessedIdentifier).toEqual("some-thing")
      expect(controller4.guessedIdentifier).toEqual("some-thing")
    })

    test("controller with dasherized name", async () => {
      const controller1 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some-thing-controller.js"))
      const controller2 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/some-thing-controller.ts"))

      expect(controller1.guessedIdentifier).toEqual("some-thing")
      expect(controller2.guessedIdentifier).toEqual("some-thing")
    })

    test("nested controller with dasherized name", async () => {
      const controller1 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch-of/levels/some-thing-controller.js"))
      const controller2 = new ControllerDefinition(project, await classDeclarationFor(project, "app/javascript/controllers/a/bunch-of/levels/some-thing-controller.ts"))

      expect(controller1.guessedIdentifier).toEqual("a--bunch-of--levels--some-thing")
      expect(controller2.guessedIdentifier).toEqual("a--bunch-of--levels--some-thing")
    })
  })
})

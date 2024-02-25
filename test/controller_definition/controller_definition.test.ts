import { describe, beforeEach, test, expect } from "vitest"
import { ControllerDefinition } from "../../src"
import { setupProject, controllerDefinitionFor } from "../helpers/setup"

let project = setupProject("app")

describe("ControllerDefinition", () => {
  beforeEach(async () => {
    project = setupProject("app")
  })

  test("relative project path", async () => {
    const controller = await controllerDefinitionFor(project, "app/javascript/controllers/some_controller.js")

    expect(controller.guessedIdentifier).toEqual("some")
    expect(controller.controllerPath).toEqual("some_controller.js")
  })

  test("relative controller path", async () => {
    const controller = await controllerDefinitionFor(project, "some_controller.js")

    expect(controller.guessedIdentifier).toEqual("some")
    expect(controller.controllerPath).toEqual("some_controller.js")
  })

  test("isNamespaced", async () => {
    const controller1 = await controllerDefinitionFor(project, "app/javascript/controllers/some_controller.js")
    const controller2 = await controllerDefinitionFor(project, "app/javascript/controllers/some_underscored_controller.js")
    const controller3 = await controllerDefinitionFor(project, "app/javascript/controllers/namespaced/some_controller.js")
    const controller4 = await controllerDefinitionFor(project, "app/javascript/controllers/nested/namespaced/some_controller.js")

    expect(controller1.isNamespaced).toBeFalsy()
    expect(controller2.isNamespaced).toBeFalsy()
    expect(controller3.isNamespaced).toBeTruthy()
    expect(controller4.isNamespaced).toBeTruthy()
  })

  test("namespace", async () => {
    const controller1 = await controllerDefinitionFor(project, "app/javascript/controllers/some_controller.js")
    const controller2 = await controllerDefinitionFor(project, "app/javascript/controllers/some_underscored_controller.js")
    const controller3 = await controllerDefinitionFor(project, "app/javascript/controllers/namespaced/some_controller.js")
    const controller4 = await controllerDefinitionFor(project, "app/javascript/controllers/nested/namespaced/some_controller.js")

    expect(controller1.namespace).toEqual("")
    expect(controller2.namespace).toEqual("")
    expect(controller3.namespace).toEqual("namespaced")
    expect(controller4.namespace).toEqual("nested--namespaced")
  })

  test("controllerPathForIdentifier", async () => {
    expect(ControllerDefinition.controllerPathForIdentifier("some")).toEqual("some_controller.js")
    expect(ControllerDefinition.controllerPathForIdentifier("some-dasherized")).toEqual("some_dasherized_controller.js")
    expect(ControllerDefinition.controllerPathForIdentifier("some_underscored")).toEqual("some_underscored_controller.js")
    expect(ControllerDefinition.controllerPathForIdentifier("namespaced--some")).toEqual("namespaced/some_controller.js")
    expect(ControllerDefinition.controllerPathForIdentifier("nested--namespaced--some")).toEqual(
      "nested/namespaced/some_controller.js"
    )
  })

  test("controllerPathForIdentifier with fileExtension", async () => {
    expect(ControllerDefinition.controllerPathForIdentifier("some", "mjs")).toEqual("some_controller.mjs")
    expect(ControllerDefinition.controllerPathForIdentifier("namespaced--some", "ts")).toEqual("namespaced/some_controller.ts")
  })

  test("type", async () => {
    expect((await controllerDefinitionFor(project, "some_controller.js", null)).type).toEqual("javascript")
    expect((await controllerDefinitionFor(project, "some_underscored.mjs", null)).type).toEqual("javascript")
    expect((await controllerDefinitionFor(project, "some_underscored.cjs", null)).type).toEqual("javascript")
    expect((await controllerDefinitionFor(project, "some_underscored.jsx", null)).type).toEqual("javascript")
    expect((await controllerDefinitionFor(project, "some_underscored.ts", null)).type).toEqual("typescript")
    expect((await controllerDefinitionFor(project, "some_underscored.mts", null)).type).toEqual("typescript")
    expect((await controllerDefinitionFor(project, "some_underscored.tsx", null)).type).toEqual("typescript")
  })
})

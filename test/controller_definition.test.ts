import { expect, test } from "vitest"
import { Project, ControllerDefinition } from "../src"

const project = new Project("/Users/marcoroth/Development/stimulus-parser")

test("absolute path", () => {
  const controller = new ControllerDefinition(
    project,
    "/Users/marcoroth/Development/stimulus-parser/app/javascript/controllers/some_controller.js"
  )

  expect(controller.identifier).toEqual("some")
  expect(controller.controllerPath).toEqual("some_controller.js")
})

test("relative project path", () => {
  const controller = new ControllerDefinition(project, "app/javascript/controllers/some_controller.js")

  expect(controller.identifier).toEqual("some")
  expect(controller.controllerPath).toEqual("some_controller.js")
})

test("relative controller path", () => {
  const controller = new ControllerDefinition(project, "some_controller.js")

  expect(controller.identifier).toEqual("some")
  expect(controller.controllerPath).toEqual("some_controller.js")
})

test("isNamespaced", () => {
  const controller1 = new ControllerDefinition(project, "some_controller.js")
  const controller2 = new ControllerDefinition(project, "some_underscored_controller.js")
  const controller3 = new ControllerDefinition(project, "namespaced/some_controller.js")
  const controller4 = new ControllerDefinition(project, "nested/namespaced/some_controller.js")

  expect(controller1.isNamespaced).toBeFalsy()
  expect(controller2.isNamespaced).toBeFalsy()
  expect(controller3.isNamespaced).toBeTruthy()
  expect(controller4.isNamespaced).toBeTruthy()
})

test("namespace", () => {
  const controller1 = new ControllerDefinition(project, "some_controller.js")
  const controller2 = new ControllerDefinition(project, "some_underscored_controller.js")
  const controller3 = new ControllerDefinition(project, "namespaced/some_controller.js")
  const controller4 = new ControllerDefinition(project, "nested/namespaced/some_controller.js")

  expect(controller1.namespace).toEqual("")
  expect(controller2.namespace).toEqual("")
  expect(controller3.namespace).toEqual("namespaced")
  expect(controller4.namespace).toEqual("nested--namespaced")
})

test("controllerPathForIdentifier", () => {
  expect(ControllerDefinition.controllerPathForIdentifier("some")).toEqual("some_controller.js")
  expect(ControllerDefinition.controllerPathForIdentifier("some-dasherized")).toEqual("some_dasherized_controller.js")
  expect(ControllerDefinition.controllerPathForIdentifier("some_underscored")).toEqual("some_underscored_controller.js")
  expect(ControllerDefinition.controllerPathForIdentifier("namespaced--some")).toEqual("namespaced/some_controller.js")
  expect(ControllerDefinition.controllerPathForIdentifier("nested--namespaced--some")).toEqual(
    "nested/namespaced/some_controller.js"
  )
})

test("controllerPathForIdentifier with fileending", () => {
  expect(ControllerDefinition.controllerPathForIdentifier("some", "mjs")).toEqual("some_controller.mjs")
  expect(ControllerDefinition.controllerPathForIdentifier("namespaced--some", "ts")).toEqual("namespaced/some_controller.ts")
})

test("type", () => {
  expect(new ControllerDefinition(project, "some_controller.js").type).toEqual("javascript")
  expect(new ControllerDefinition(project, "some_underscored.mjs").type).toEqual("javascript")
  expect(new ControllerDefinition(project, "some_underscored.cjs").type).toEqual("javascript")
  expect(new ControllerDefinition(project, "some_underscored.jsx").type).toEqual("javascript")
  expect(new ControllerDefinition(project, "some_underscored.ts").type).toEqual("typescript")
  expect(new ControllerDefinition(project, "some_underscored.mts").type).toEqual("typescript")
  expect(new ControllerDefinition(project, "some_underscored.tsx").type).toEqual("typescript")
})

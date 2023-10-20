import { expect, test } from "vitest"
import { Project } from "../src"

const project = new Project("/Users/marcoroth/Development/stimulus-parser")

test("relativePath", () => {
  expect(project.relativePath("/Users/marcoroth/Development/stimulus-parser/path/to/some/file.js")).toEqual(
    "path/to/some/file.js"
  )
})

test("relativeControllerPath", () => {
  expect(
    project.relativeControllerPath(
      "/Users/marcoroth/Development/stimulus-parser/app/javascript/controllers/some_controller.js"
    )
  ).toEqual("some_controller.js")
  expect(
    project.relativeControllerPath(
      "/Users/marcoroth/Development/stimulus-parser/app/javascript/controllers/nested/some_controller.js"
    )
  ).toEqual("nested/some_controller.js")
  expect(
    project.relativeControllerPath(
      "/Users/marcoroth/Development/stimulus-parser/app/javascript/controllers/nested/deeply/some_controller.js"
    )
  ).toEqual("nested/deeply/some_controller.js")
})

test("controllerRoot and controllerRoots", async () => {
  const project = new Project("test/fixtures/controller-paths")

  expect(project.controllerRootFallback).toEqual("app/javascript/controllers")
  expect(project.controllerRoot).toEqual("app/javascript/controllers")
  expect(project.controllerRoots).toEqual([])

  await project.analyze()

  expect(project.controllerRoot).toEqual("app/javascript/controllers")

  expect(project.controllerRoots).toEqual([
    "app/javascript/controllers",
    "app/packs/controllers",
    "resources/js/controllers",
  ])
})

test("identifier in different controllerRoots", async () => {
  const project = new Project("test/fixtures/controller-paths")

  await project.analyze()

  const identifiers = project.controllerDefinitions.map(controller => controller.identifier).sort()

  expect(identifiers).toEqual([
    "laravel",
    "nested--laravel",
    "nested--rails",
    "nested--twice--laravel",
    "nested--twice--rails",
    "nested--twice--webpack",
    "nested--webpack",
    "rails",
    "webpack",
  ])
})

test("static calculateControllerRoots", () => {
  expect(
    Project.calculateControllerRoots([
      "app/javascript/controllers/some_controller.js",
      "app/javascript/controllers/nested/some_controller.js",
      "app/javascript/controllers/nested/deeply/some_controller.js",
    ])
  ).toEqual([
    "app/javascript/controllers"
  ])

  expect(
    Project.calculateControllerRoots(
      [
        "app/packs/controllers/some_controller.js",
        "app/packs/controllers/nested/some_controller.js",
        "app/packs/controllers/nested/deeply/some_controller.js",
        "app/javascript/controllers/some_controller.js",
        "app/javascript/controllers/nested/some_controller.js",
        "app/javascript/controllers/nested/deeply/some_controller.js",
        "resources/js/controllers/some_controller.js",
        "resources/js/controllers/nested/some_controller.js",
        "resources/js/controllers/nested/deeply/some_controller.js",
      ]
    )
  ).toEqual([
    "app/javascript/controllers",
    "app/packs/controllers",
    "resources/js/controllers"
  ])
})

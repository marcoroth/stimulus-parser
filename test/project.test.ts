import { expect, test, beforeEach } from "vitest"
import { Project } from "../src"

let project: Project

beforeEach(() => {
  project = new Project("/Users/marcoroth/Development/stimulus-parser")
})

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
  expect(project.controllerRoots).toEqual(["app/javascript/controllers"])

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
    "typescript",
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

test("possibleControllerPathsForIdentifier", async () => {
  expect(project.possibleControllerPathsForIdentifier("rails")).toEqual([
    "app/javascript/controllers/rails_controller.js",
    "app/javascript/controllers/rails_controller.mjs",
    "app/javascript/controllers/rails_controller.cjs",
    "app/javascript/controllers/rails_controller.jsx",
    "app/javascript/controllers/rails_controller.ts",
    "app/javascript/controllers/rails_controller.mts",
    "app/javascript/controllers/rails_controller.tsx",
  ])

  await project.analyze()

  expect(project.possibleControllerPathsForIdentifier("rails")).toEqual([
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.js",
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.mjs",
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.cjs",
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.jsx",
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.ts",
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.mts",
    "test/fixtures/controller-paths/app/javascript/controllers/rails_controller.tsx",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.js",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.mjs",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.cjs",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.jsx",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.ts",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.mts",
    "test/fixtures/controller-paths/app/packs/controllers/rails_controller.tsx",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.js",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.mjs",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.cjs",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.jsx",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.ts",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.mts",
    "test/fixtures/controller-paths/resources/js/controllers/rails_controller.tsx",
  ])
})

test("findControllerPathForIdentifier", async () => {
  expect(await project.findControllerPathForIdentifier("rails")).toBeNull()
  expect(await project.findControllerPathForIdentifier("nested--twice--rails")).toBeNull()
  expect(await project.findControllerPathForIdentifier("typescript")).toBeNull()
  expect(await project.findControllerPathForIdentifier("webpack")).toBeNull()
  expect(await project.findControllerPathForIdentifier("nested--webpack")).toBeNull()
  expect(await project.findControllerPathForIdentifier("doesnt-exist")).toBeNull()

  await project.analyze()

  expect(await project.findControllerPathForIdentifier("rails")).toEqual("test/fixtures/controller-paths/app/javascript/controllers/rails_controller.js")
  expect(await project.findControllerPathForIdentifier("nested--twice--rails")).toEqual("test/fixtures/controller-paths/app/javascript/controllers/nested/twice/rails_controller.js")
  expect(await project.findControllerPathForIdentifier("typescript")).toEqual("test/fixtures/controller-paths/app/javascript/controllers/typescript_controller.ts")
  expect(await project.findControllerPathForIdentifier("webpack")).toEqual("test/fixtures/controller-paths/app/packs/controllers/webpack_controller.js")
  expect(await project.findControllerPathForIdentifier("nested--webpack")).toEqual("test/fixtures/controller-paths/app/packs/controllers/nested/webpack_controller.js")
  expect(await project.findControllerPathForIdentifier("doesnt-exist")).toBeNull()
})

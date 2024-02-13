import { describe, expect, test, beforeEach } from "vitest"
import { Project } from "../src"

let project: Project

beforeEach(() => {
  project = new Project(process.cwd())
})

test("relativePath", () => {
  expect(project.relativePath(`${process.cwd()}/path/to/some/file.js`)).toEqual(
    "path/to/some/file.js"
  )
})

test("relativeControllerPath", () => {
  expect(
    project.relativeControllerPath(
      `${process.cwd()}/app/javascript/controllers/some_controller.js`
    )
  ).toEqual("some_controller.js")
  expect(
    project.relativeControllerPath(
      `${process.cwd()}/app/javascript/controllers/nested/some_controller.js`
    )
  ).toEqual("nested/some_controller.js")
  expect(
    project.relativeControllerPath(
      `${process.cwd()}/app/javascript/controllers/nested/deeply/some_controller.js`
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

describe("calculateControllerRoots", () => {
  test("same root", () => {
    expect(
      Project.calculateControllerRoots([
        "app/javascript/controllers/some_controller.js",
        "app/javascript/controllers/nested/some_controller.js",
        "app/javascript/controllers/nested/deeply/some_controller.js",
      ])
    ).toEqual([
      "app/javascript/controllers"
    ])
  })

  test("different roots", () => {
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

  describe("no common root", () => {
    test("nested first", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "test/fixtures/controller-paths/app/javascript/controllers/typescript_controller.ts",
            "test/fixtures/controller-paths/app/packs/controllers/webpack_controller.js",
            "test/fixtures/controller-paths/app/packs/controllers/nested/twice/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/laravel_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/nested/twice/laravel_controller.js",
            "test/fixtures/controller-paths/app/javascript/controllers/nested/twice/rails_controller.js",
            "node_modules/tailwindcss-stimulus-components/src/tabs.js",
            "node_modules/tailwindcss-stimulus-components/src/toggle.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/slideover.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src",
        "test/fixtures/controller-paths/app/javascript/controllers",
        "test/fixtures/controller-paths/app/packs/controllers",
        "test/fixtures/controller-paths/resources/js/controllers",
      ])
    })

    test("nested last", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "test/fixtures/controller-paths/app/packs/controllers/nested/twice/webpack_controller.js",
            "test/fixtures/controller-paths/app/packs/controllers/nested/webpack_controller.js",
            "test/fixtures/controller-paths/app/packs/controllers/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/nested/twice/rails_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/nested/twice/laravel_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/laravel_controller.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/slideover.js",
            "node_modules/tailwindcss-stimulus-components/src/toggle.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src",
        "test/fixtures/controller-paths/app/packs/controllers",
        "test/fixtures/controller-paths/resources/js/controllers",
      ])
    })

    test("nested mixed", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "test/fixtures/controller-paths/app/packs/controllers/nested/webpack_controller.js",
            "test/fixtures/controller-paths/app/packs/controllers/nested/twice/webpack_controller.js",
            "test/fixtures/controller-paths/app/packs/controllers/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/nested/rails_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/nested/twice/laravel_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/laravel_controller.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/slideover.js",
            "node_modules/tailwindcss-stimulus-components/src/toggle.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/twice/modal.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src",
        "test/fixtures/controller-paths/app/packs/controllers",
        "test/fixtures/controller-paths/resources/js/controllers",
      ])
    })

    test("with only one file", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "test/fixtures/controller-paths/app/packs/controllers/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/laravel_controller.js",
            "node_modules/tailwindcss-stimulus-components/src/modal.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src",
        "test/fixtures/controller-paths/app/packs/controllers",
        "test/fixtures/controller-paths/resources/js/controllers",
      ])
    })

    test("with only one file in nested folder", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "test/fixtures/controller-paths/app/packs/controllers/nested/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/controllers/nested/laravel_controller.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/modal.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src/nested",
        "test/fixtures/controller-paths/app/packs/controllers",
        "test/fixtures/controller-paths/resources/js/controllers",
      ])
    })

    test("with no controllers folder and only one file in nested folder", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "test/fixtures/controller-paths/app/packs/nested/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/nested/laravel_controller.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/modal.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src/nested",
        "test/fixtures/controller-paths/app/packs/nested",
        "test/fixtures/controller-paths/resources/js/nested",
      ])
    })

    test("with with no controllers folder and multiple files", () => {
      expect(
        Project.calculateControllerRoots(
          [
            "node_modules/tailwindcss-stimulus-components/src/modal.js",
            "node_modules/tailwindcss-stimulus-components/src/nested/modal.js",
            "test/fixtures/controller-paths/app/packs/nested/webpack_controller.js",
            "test/fixtures/controller-paths/app/packs/webpack_controller.js",
            "test/fixtures/controller-paths/resources/js/laravel_controller.js",
            "test/fixtures/controller-paths/resources/js/nested/laravel_controller.js",
          ]
        )
      ).toEqual([
        "node_modules/tailwindcss-stimulus-components/src",
        "test/fixtures/controller-paths/app/packs",
        "test/fixtures/controller-paths/resources/js",
      ])
    })
  })
})

test("possibleControllerPathsForIdentifier", async () => {
  project = new Project(`${process.cwd()}/test/fixtures/controller-paths`)

  // This is only using the controllerRootFallback because we haven't found/analyzed anything else yet
  expect(project.possibleControllerPathsForIdentifier("rails")).toEqual([
    "app/javascript/controllers/rails_controller.cjs",
    "app/javascript/controllers/rails_controller.js",
    "app/javascript/controllers/rails_controller.jsx",
    "app/javascript/controllers/rails_controller.mjs",
    "app/javascript/controllers/rails_controller.mts",
    "app/javascript/controllers/rails_controller.ts",
    "app/javascript/controllers/rails_controller.tsx",
  ])

  await project.analyze()

  expect(project.possibleControllerPathsForIdentifier("rails")).toEqual([
    "app/javascript/controllers/rails_controller.cjs",
    "app/javascript/controllers/rails_controller.js",
    "app/javascript/controllers/rails_controller.jsx",
    "app/javascript/controllers/rails_controller.mjs",
    "app/javascript/controllers/rails_controller.mts",
    "app/javascript/controllers/rails_controller.ts",
    "app/javascript/controllers/rails_controller.tsx",
    "app/packs/controllers/rails_controller.cjs",
    "app/packs/controllers/rails_controller.js",
    "app/packs/controllers/rails_controller.jsx",
    "app/packs/controllers/rails_controller.mjs",
    "app/packs/controllers/rails_controller.mts",
    "app/packs/controllers/rails_controller.ts",
    "app/packs/controllers/rails_controller.tsx",
    "resources/js/controllers/rails_controller.cjs",
    "resources/js/controllers/rails_controller.js",
    "resources/js/controllers/rails_controller.jsx",
    "resources/js/controllers/rails_controller.mjs",
    "resources/js/controllers/rails_controller.mts",
    "resources/js/controllers/rails_controller.ts",
    "resources/js/controllers/rails_controller.tsx",
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

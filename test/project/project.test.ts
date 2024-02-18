import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

let project = setupProject("controller-paths")

describe("Project", () => {
  beforeEach(() => {
    project = setupProject("controller-paths")
  })

  test("relativePath", () => {
    expect(project.relativePath(`${project.projectPath}/path/to/some/file.js`)).toEqual(
      "path/to/some/file.js"
    )
  })

  test("relativeControllerPath", () => {
    expect(
      project.relativeControllerPath(
        `${project.projectPath}/app/javascript/controllers/some_controller.js`
      )
    ).toEqual("some_controller.js")
    expect(
      project.relativeControllerPath(
        `${project.projectPath}/app/javascript/controllers/nested/some_controller.js`
      )
    ).toEqual("nested/some_controller.js")
    expect(
      project.relativeControllerPath(
        `${project.projectPath}/app/javascript/controllers/nested/deeply/some_controller.js`
      )
    ).toEqual("nested/deeply/some_controller.js")
  })

  test("controllerRoot and controllerRoots", async () => {
    expect(project.controllerRootFallback).toEqual("app/javascript/controllers")
    expect(project.controllerRoot).toEqual("app/javascript/controllers")
    expect(project.controllerRoots).toEqual(["app/javascript/controllers"])

    await project.initialize()

    expect(project.controllerRoot).toEqual("app/javascript/controllers")

    expect(project.controllerRoots).toEqual([
      "app/javascript/controllers",
      "app/packs/controllers",
      "resources/js/controllers",
    ])
  })

  test("identifier in different controllerRoots", async () => {
    expect(project.controllerDefinitions.map(controller => controller.identifier)).toEqual([])

    await project.initialize()

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

  test("possibleControllerPathsForIdentifier", async () => {
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

    await project.initialize()

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

  test("findControllerPathForIdentifier for controllers that are not in project", async () => {
    project = setupProject("app")

    expect(await project.findControllerPathForIdentifier("rails")).toBeNull()
    expect(await project.findControllerPathForIdentifier("nested--twice--rails")).toBeNull()
    expect(await project.findControllerPathForIdentifier("typescript")).toBeNull()
    expect(await project.findControllerPathForIdentifier("webpack")).toBeNull()
    expect(await project.findControllerPathForIdentifier("nested--webpack")).toBeNull()
    expect(await project.findControllerPathForIdentifier("doesnt-exist")).toBeNull()
  })

  test("findControllerPathForIdentifier", async () => {
    project = setupProject("controller-paths")

    // it can find these before the initialize() call
    // because they are in the controller root fallback folder
    expect(await project.findControllerPathForIdentifier("rails")).toEqual("app/javascript/controllers/rails_controller.js")
    expect(await project.findControllerPathForIdentifier("nested--twice--rails")).toEqual("app/javascript/controllers/nested/twice/rails_controller.js")
    expect(await project.findControllerPathForIdentifier("typescript")).toEqual("app/javascript/controllers/typescript_controller.ts")

    // but it cannot find these because they are in a non-standard location
    expect(await project.findControllerPathForIdentifier("webpack")).toBeNull()
    expect(await project.findControllerPathForIdentifier("nested--webpack")).toBeNull()
    expect(await project.findControllerPathForIdentifier("doesnt-exist")).toBeNull()

    await project.initialize()

    // but after initializing the project it knows about all the controller roots and can find them
    expect(await project.findControllerPathForIdentifier("rails")).toEqual("app/javascript/controllers/rails_controller.js")
    expect(await project.findControllerPathForIdentifier("nested--twice--rails")).toEqual("app/javascript/controllers/nested/twice/rails_controller.js")
    expect(await project.findControllerPathForIdentifier("typescript")).toEqual("app/javascript/controllers/typescript_controller.ts")
    expect(await project.findControllerPathForIdentifier("webpack")).toEqual("app/packs/controllers/webpack_controller.js")
    expect(await project.findControllerPathForIdentifier("nested--webpack")).toEqual("app/packs/controllers/nested/webpack_controller.js")
    expect(await project.findControllerPathForIdentifier("doesnt-exist")).toBeNull()
  })
})

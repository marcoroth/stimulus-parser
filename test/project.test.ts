import { describe, expect, test, beforeEach } from "vitest"
import { Project } from "../src"

let project: Project

beforeEach(() => {
  project = new Project(process.cwd())
})

describe("Project", () => {
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
})

import { expect, test } from "vitest"
import { Project } from "../src"

const TEST_PROJECT_PATH = "/Users/marcoroth/Development/stimulus-parser";

const project = new Project(TEST_PROJECT_PATH)
const projectWithCustomControllerPath = new Project(TEST_PROJECT_PATH, "resources/js/controllers")

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

test("relativeControllerPath with custom controller path", () => {
  expect(
    projectWithCustomControllerPath.relativeControllerPath(
      "/Users/marcoroth/Development/stimulus-parser/resources/js/controllers/some_controller.js"
    )
  ).toEqual("some_controller.js")
  expect(
    projectWithCustomControllerPath.relativeControllerPath(
      "/Users/marcoroth/Development/stimulus-parser/resources/js/controllers/nested/some_controller.js"
    )
  ).toEqual("nested/some_controller.js")
  expect(
    projectWithCustomControllerPath.relativeControllerPath(
      "/Users/marcoroth/Development/stimulus-parser/resources/js/controllers/nested/deeply/some_controller.js"
    )
  ).toEqual("nested/deeply/some_controller.js")
})

import { describe, test, expect } from "vitest"
import { calculateControllerRoots } from "../../../src/util/project"

describe("util.project", () => {
  describe("calculateControllerRoots", () => {
    test("same root", () => {
      expect(
        calculateControllerRoots([
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
        calculateControllerRoots(
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
          calculateControllerRoots(
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
          calculateControllerRoots(
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
          calculateControllerRoots(
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
          calculateControllerRoots(
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
          calculateControllerRoots(
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
          calculateControllerRoots(
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
          calculateControllerRoots(
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
})

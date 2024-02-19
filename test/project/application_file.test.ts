import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

describe("Project", () => {
  describe("ApplicationFile", () => {
    test("finds appliaction file for webpacker", async () => {
      const project = setupProject("webpacker")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for shakapacker", async () => {
      const project = setupProject("shakapacker")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for esbuild-rails", async () => {
      const project = setupProject("esbuild-rails")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for esbuild", async () => {
      const project = setupProject("esbuild")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for vite-rails", async () => {
      const project = setupProject("vite-rails")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/frontend/controllers/application.js")
    })

    test("finds appliaction file for bun", async () => {
      const project = setupProject("bun")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for importmap-rails lazy", async () => {
      const project = setupProject("importmap-rails-lazy")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for importmap-rails eager", async () => {
      const project = setupProject("importmap-rails-eager")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })

    test("finds appliaction file for rollup", async () => {
      const project = setupProject("rollup")

      expect(project.applicationFile).toBeUndefined()

      await project.initialize()

      expect(project.applicationFile).toBeDefined()
      expect(project.relativePath(project.applicationFile.path)).toEqual("app/javascript/controllers/application.js")
    })
  })
})

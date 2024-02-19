import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

describe("Project", () => {
  describe("ControllersIndexFile", () => {
    test("finds controllers index file for webpacker", async () => {
      const project = setupProject("webpacker")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for shakapacker", async () => {
      const project = setupProject("shakapacker")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for esbuild-rails", async () => {
      const project = setupProject("esbuild-rails")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for esbuild", async () => {
      const project = setupProject("esbuild")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for vite-rails", async () => {
      const project = setupProject("vite-rails")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/frontend/controllers/index.js")
    })

    test("finds controllers index file for bun", async () => {
      const project = setupProject("bun")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for importmap-rails lazy", async () => {
      const project = setupProject("importmap-rails-lazy")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for importmap-rails eager", async () => {
      const project = setupProject("importmap-rails-eager")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })

    test("finds controllers index file for rollup", async () => {
      const project = setupProject("rollup")

      expect(project.controllersFile).toBeUndefined()

      await project.initialize()

      expect(project.controllersFile).toBeDefined()
      expect(project.relativePath(project.controllersFile.path)).toEqual("app/javascript/controllers/index.js")
    })
  })
})

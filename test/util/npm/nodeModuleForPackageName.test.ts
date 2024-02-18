import { describe, beforeEach, test, expect } from "vitest"
import { nodeModuleForPackageName } from "../../../src/util/npm"
import { setupProject } from "../../helpers/setup"

let project = setupProject("app")

describe("util.npm", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  describe("nodeModuleForPackageName", () => {
    test("find and analyzes node module", async () => {
      const nodeModule = await nodeModuleForPackageName(project, "tailwindcss-stimulus-components")

      expect(nodeModule.name).toEqual("tailwindcss-stimulus-components")
      expect(nodeModule.type).toEqual("source")
      expect(nodeModule.project).toEqual(project)

      expect(project.relativePath(nodeModule.path)).toEqual("node_modules/tailwindcss-stimulus-components")
      expect(project.relativePath(nodeModule.entrypoint)).toEqual("node_modules/tailwindcss-stimulus-components/src/index.js")

      expect(nodeModule.controllerRoots.map(path => project.relativePath(path))).toEqual([
        "node_modules/tailwindcss-stimulus-components/src"
      ])

      expect(nodeModule.files.map(file => project.relativePath(file))).toEqual([
        "node_modules/tailwindcss-stimulus-components/src/transition.js",
        "node_modules/tailwindcss-stimulus-components/src/toggle.js",
        "node_modules/tailwindcss-stimulus-components/src/tabs.js",
        "node_modules/tailwindcss-stimulus-components/src/slideover.js",
        "node_modules/tailwindcss-stimulus-components/src/popover.js",
        "node_modules/tailwindcss-stimulus-components/src/modal.js",
        "node_modules/tailwindcss-stimulus-components/src/index.js",
        "node_modules/tailwindcss-stimulus-components/src/dropdown.js",
        "node_modules/tailwindcss-stimulus-components/src/color_preview.js",
        "node_modules/tailwindcss-stimulus-components/src/autosave.js",
        "node_modules/tailwindcss-stimulus-components/src/alert.js",
      ])
    })
  })
})

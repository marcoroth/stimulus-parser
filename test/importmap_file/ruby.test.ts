import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"
import { SourceFile } from "../../src/source_file"
import { ImportmapFile } from "../../src/importmap_file"

let project = setupProject("importmap-rails-eager")

describe("ImportmapFile", () => {
  beforeEach(() => {
    project = setupProject("importmap-rails-eager")
  })

  test("analyze", async () => {
    const code = dedent`
      # Pin npm packages by running ./bin/importmap

      pin "application"
      pin "application", preload: true
      pin "@hotwired/stimulus", to: "stimulus.min.js"
      pin "@hotwired/stimulus-loading", to: "stimulus-loading.js", preload: true

      pin_all_from "app/javascript/config", under: "config"
      pin_all_from "app/javascript/controllers", under: "controllers", preload: false
    `

    const sourceFile = new SourceFile(project, "config/importmap.rb", code)
    project.projectFiles.push(sourceFile)

    const importmapFile = new ImportmapFile(project, sourceFile, "ruby")
    await importmapFile.analyze()

    expect(importmapFile.pins.length).toEqual(4)
    expect(importmapFile.pinAllFromPins.length).toEqual(2)

    expect(importmapFile.pins[0]).toEqual({ identifier: "application", preload: false, to: undefined, projectPath: "app/javascript" })
    expect(importmapFile.pins[1]).toEqual({ identifier: "application", preload: true, to: undefined, projectPath: "app/javascript" })
    expect(importmapFile.pins[2]).toEqual({ identifier: "@hotwired/stimulus", preload: false, to: "stimulus.min.js", projectPath: "app/javascript" })
    expect(importmapFile.pins[3]).toEqual({ identifier: "@hotwired/stimulus-loading", preload: true, to: "stimulus-loading.js", projectPath: "app/javascript" })

    expect(importmapFile.pinAllFromPins[0]).toEqual({ directory: "app/javascript/config", under: "config", preload: true, projectPath: "app/javascript" })
    expect(importmapFile.pinAllFromPins[1]).toEqual({ directory: "app/javascript/controllers", under: "controllers", preload: false, projectPath: "app/javascript" })
  })
})

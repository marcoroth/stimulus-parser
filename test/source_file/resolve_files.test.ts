import dedent from "dedent"
import path from "path"

import { describe, beforeEach, test, expect } from "vitest"
import { Project, SourceFile, ClassDeclaration } from "../../src"

let project = new Project(`${process.cwd()}/test/fixtures/app`)

const emptyController = `
  import { Controller } from "@hotwired/stimulus"

  export default class extends Controller {}
`

describe("SourceFile", () => {
  beforeEach(() => {
    project = new Project(`${process.cwd()}/test/fixtures/app`)
  })

  describe("resolve files", () => {
    test("relative path same directory with .js files", async () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "./application_controller"

        export default class extends ApplicationController {}
      `

      const applicationControllerFile = new SourceFile(project, "app/javascript/application_controller.js", applicationControllerCode)
      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.js", helloControllerCode)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/application_controller.js")
    })

    test("relative path same directory with .ts files", () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "./nested/application_controller"

        export default class extends ApplicationController {}
      `

      const applicationControllerFile = new SourceFile(project, "app/javascript/nested/application_controller.ts", applicationControllerCode)
      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.ts", helloControllerCode)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/nested/application_controller.ts")
    })

    test("relative path same directory with .js file extension", () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "./application_controller.js"

        export default class extends ApplicationController {}
      `

      const applicationControllerFile = new SourceFile(project, "app/javascript/application_controller.js", applicationControllerCode)
      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.js", helloControllerCode)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/application_controller.js")
    })

    test("relative path same directory with .ts file extension", () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "./application_controller.ts"

        export default class extends ApplicationController {}
      `

      const applicationControllerFile = new SourceFile(project, "app/javascript/application_controller.ts", applicationControllerCode)
      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.ts", helloControllerCode)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/application_controller.ts")
    })

    test("relative path directory above", () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "../application_controller"

        export default class extends ApplicationController {}
      `

      const applicationControllerFile = new SourceFile(project, "app/javascript/application_controller.js", applicationControllerCode)
      const helloControllerFile = new SourceFile(project, "app/javascript/nested/hello_controller.js", helloControllerCode)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/application_controller.js")
    })

    test("relative path directory below", () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "./nested/application_controller"

        export default class extends ApplicationController {}
      `

      const applicationControllerFile = new SourceFile(project, "app/javascript/nested/application_controller.js", applicationControllerCode)
      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.js", helloControllerCode)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/nested/application_controller.js")
    })

    test("doesn't resolve node module path for unknown package", () => {
      const helloControllerCode = dedent`
        import { Modal } from "some-unknown-package"

        export default class extends ApplicationController {}
      `

      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.js", helloControllerCode)
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toBeUndefined()
    })

    test("doesn't resolve controller definition when ancestor is not stimulus controller but stimulus ancestor gets imported", async () => {
      const helloControllerCode = dedent`
        import { Modal } from "tailwindcss-stimulus-components"

        class ApplicationController extends Controller {}
        export default class extends ApplicationController {}
      `

      const helloControllerFile = new SourceFile(project, "app/javascript/hello_controller.js", helloControllerCode)
      helloControllerFile.analyze()

      project.projectFiles.push(helloControllerFile)

      await project.analyze()

      expect(helloControllerFile.errors).toHaveLength(0)
      expect(helloControllerFile.resolvedControllerDefinitions).toEqual([])
    })

    test("resolve node module package path with node module in detectedNodeModules", async () => {
      const helloControllerCode = dedent`
        import { Modal } from "tailwindcss-stimulus-components"

        class ApplicationController extends Modal {}
        class IntermediateController extends ApplicationController {}

        export default class extends ApplicationController {}
      `

      const helloControllerFile = new SourceFile(project, path.join(project.projectPath, "app/javascript/hello_controller.js"), helloControllerCode)
      helloControllerFile.analyze()

      project.projectFiles.push(helloControllerFile)

      expect(project.projectFiles.map(file => [project.relativePath(file.path), file.content])).toEqual([["app/javascript/hello_controller.js", helloControllerCode]])
      expect(project.referencedNodeModules).toEqual(["tailwindcss-stimulus-components"])

      await project.detectAvailablePackages()
      await project.analyzeReferencedModules()

      expect(project.projectFiles.map(file => [project.relativePath(file.path), file.content])).toEqual([["app/javascript/hello_controller.js", helloControllerCode]])
      expect(project.detectedNodeModules.map(m => m.name)).toContain("tailwindcss-stimulus-components")
      expect(project.referencedNodeModules).toEqual(["tailwindcss-stimulus-components"])

      expect(helloControllerFile.exportDeclarations).toHaveLength(1)

      const declaration = helloControllerFile.exportDeclarations[0]

      expect(declaration).toBeDefined()

      expect(declaration.exportedClassDeclaration).toBeDefined()
      expect(project.relativePath(declaration.exportedClassDeclaration.sourceFile.path)).toEqual("app/javascript/hello_controller.js")

      expect(project.relativePath(declaration.resolvedPath)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
      expect(project.relativePath(declaration.resolvedSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
      expect(project.relativePath(declaration.resolvedExportDeclaration.sourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
      expect(project.relativePath(declaration.resolvedClassDeclaration.sourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")
      expect(project.relativePath(declaration.resolvedControllerDefinition.classDeclaration.sourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/modal.js")

      expect(declaration.resolvedClassDeclaration.superClass.className).toEqual("Controller")
      expect(declaration.resolvedClassDeclaration.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
      expect(declaration.resolvedClassDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(true)

      expect(declaration.resolvedControllerDefinition.classNames).toEqual([])
      expect(declaration.resolvedControllerDefinition.targetNames).toEqual(["container", "background"])
      expect(Object.keys(declaration.resolvedControllerDefinition.valueDefinitions)).toEqual(["open", "restoreScroll"])
      expect(declaration.resolvedControllerDefinition.methodNames).toEqual([
        "disconnect",
        "open",
        "close",
        "closeBackground",
        "openValueChanged",
        "lockScroll",
        "unlockScroll",
        "saveScrollPosition",
        "restoreScrollPosition"
      ])
    })

    test("resovles file through ancestors", async () => {
      const helloControllerCode = dedent`
        import { Modal } from "tailwindcss-stimulus-components"

        class ApplicationController extends Modal {
          third() {}
        }

        class IntermediateController extends ApplicationController {
          second() {}
        }

        export default class extends IntermediateController {
          first() {}
        }
      `

      const helloControllerFile = new SourceFile(project, path.join(project.projectPath, "app/javascript/hello_controller.js"), helloControllerCode)
      helloControllerFile.analyze()

      project.projectFiles.push(helloControllerFile)

      expect(project.projectFiles.map(file => [project.relativePath(file.path), file.content])).toEqual([["app/javascript/hello_controller.js", helloControllerCode]])
      expect(project.referencedNodeModules).toEqual(["tailwindcss-stimulus-components"])

      await project.detectAvailablePackages()
      await project.analyzeReferencedModules()

      expect(project.projectFiles.map(file => [project.relativePath(file.path), file.content])).toEqual([["app/javascript/hello_controller.js", helloControllerCode]])
      expect(project.detectedNodeModules.map(m => m.name)).toContain("tailwindcss-stimulus-components")
      expect(project.referencedNodeModules).toEqual(["tailwindcss-stimulus-components"])

      expect(helloControllerFile.exportDeclarations).toHaveLength(1)

      const declaration = helloControllerFile.exportDeclarations[0]
      const klass = declaration.exportedClassDeclaration

      expect(klass.ancestors).toHaveLength(4)

      console.log(klass.ancestors.map(klass => klass.node))


      expect(klass.ancestors.map(klass => project.relativePath(klass.sourceFile.path))).toEqual([
        "app/javascript/hello_controller.js",
        "app/javascript/hello_controller.js",
        "app/javascript/hello_controller.js",
        "node_modules/tailwindcss-stimulus-components/src/modal.js",
      ])

      expect(klass.ancestors.map(klass => klass.className)).toEqual([
        undefined,
        "IntermediateController",
        "ApplicationController",
        undefined,
      ])

      expect(klass.ancestors.map(klass => klass.controllerDefinition?.methodNames)).toEqual([
        ["first"],
        ["second"],
        ["third"],
        [
          "disconnect",
          "open",
          "close",
          "closeBackground",
          "openValueChanged",
          "lockScroll",
          "unlockScroll",
          "saveScrollPosition",
          "restoreScrollPosition"
        ],
      ])

    })

    test.skip("resolve node module package path with node module in detectedNodeModules via second file", async () => {
      const applicationControllerCode = dedent`
        import { Autosave } from "tailwindcss-stimulus-components"

        export default class extends Autosave {}
      `

      const helloControllerCode = dedent`
        import ApplicationController from "./application_controller"

        class IntermediateController extends ApplicationController {}

        export default class Hello extends IntermediateController {}
      `

      const applicationControllerFile = new SourceFile(project, path.join(project.projectPath, "app/javascript/application_controller.js"), applicationControllerCode)
      const helloControllerFile = new SourceFile(project, path.join(project.projectPath, "app/javascript/hello_controller.js"), helloControllerCode)

      project.projectFiles.push(applicationControllerFile)
      project.projectFiles.push(helloControllerFile)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(project.projectFiles.map(file => [project.relativePath(file.path), file.content])).toEqual([
        ["app/javascript/application_controller.js", applicationControllerCode],
        ["app/javascript/hello_controller.js", helloControllerCode],
      ])
      expect(project.referencedNodeModules).toEqual(["tailwindcss-stimulus-components"])

      await project.detectAvailablePackages()
      await project.analyzeReferencedModules()

      expect(project.projectFiles.map(file => [project.relativePath(file.path), file.content])).toEqual([
        ["app/javascript/application_controller.js", applicationControllerCode],
        ["app/javascript/hello_controller.js", helloControllerCode],
      ])
      expect(project.detectedNodeModules.map(m => m.name)).toContain("tailwindcss-stimulus-components")
      expect(project.referencedNodeModules).toEqual(["tailwindcss-stimulus-components"])


      expect(helloControllerFile.exportDeclarations).toHaveLength(1)

      const declaration = helloControllerFile.exportDeclarations[0]

      expect(declaration).toBeDefined()

      expect(declaration.exportedClassDeclaration).toBeDefined()
      expect(project.relativePath(declaration.exportedClassDeclaration.sourceFile.path)).toEqual("app/javascript/hello_controller.js")

      expect(project.relativePath(declaration.resolvedPath)).toEqual("node_modules/tailwindcss-stimulus-components/src/autosave.js")
      expect(project.relativePath(declaration.resolvedSourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/autosave.js")
      expect(project.relativePath(declaration.resolvedExportDeclaration.sourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/autosave.js")
      expect(project.relativePath(declaration.resolvedClassDeclaration.sourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/autosave.js")
      expect(project.relativePath(declaration.resolvedControllerDefinition.classDeclaration.sourceFile.path)).toEqual("node_modules/tailwindcss-stimulus-components/src/autosave.js")

      expect(declaration.resolvedClassDeclaration.superClass.className).toEqual("Controller")
      expect(declaration.resolvedClassDeclaration.superClass.importDeclaration.source).toEqual("@hotwired/stimulus")
      expect(declaration.resolvedClassDeclaration.superClass.importDeclaration.isStimulusImport).toEqual(true)

      expect(declaration.resolvedControllerDefinition.methodNames).toEqual([])
      expect(declaration.resolvedControllerDefinition.classNames).toEqual([])
      expect(declaration.resolvedControllerDefinition.targetNames).toEqual(["form", "status"])
      expect(Object.keys(declaration.resolvedControllerDefinition.valueDefinitions)).toEqual(["submitDuration", "statusDuration", "submittingText", "successText", "errorText"])
    })
  })
})

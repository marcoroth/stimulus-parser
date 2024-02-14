import dedent from "dedent"
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

  describe("resvole files", () => {
    test("relative path same directory with .js files", async () => {
      const applicationControllerCode = emptyController

      const helloControllerCode = dedent`
        import ApplicationController from "./application_controller"

        export default class extends ApplicationController {}
      `

      await project.analyze()

      const applicationControllerFile = new SourceFile("app/javascript/application_controller.js", applicationControllerCode, project)
      const helloControllerFile = new SourceFile("app/javascript/hello_controller.js", helloControllerCode, project)

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

      const applicationControllerFile = new SourceFile("app/javascript/nested/application_controller.ts", applicationControllerCode, project)
      const helloControllerFile = new SourceFile("app/javascript/hello_controller.ts", helloControllerCode, project)

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

      const applicationControllerFile = new SourceFile("app/javascript/application_controller.js", applicationControllerCode, project)
      const helloControllerFile = new SourceFile("app/javascript/hello_controller.js", helloControllerCode, project)

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

      const applicationControllerFile = new SourceFile("app/javascript/application_controller.ts", applicationControllerCode, project)
      const helloControllerFile = new SourceFile("app/javascript/hello_controller.ts", helloControllerCode, project)

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

      const applicationControllerFile = new SourceFile("app/javascript/application_controller.js", applicationControllerCode, project)
      const helloControllerFile = new SourceFile("app/javascript/nested/hello_controller.js", helloControllerCode, project)

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

      const applicationControllerFile = new SourceFile("app/javascript/nested/application_controller.js", applicationControllerCode, project)
      const helloControllerFile = new SourceFile("app/javascript/hello_controller.js", helloControllerCode, project)

      applicationControllerFile.analyze()
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toEqual("app/javascript/nested/application_controller.js")
    })

    test("resolve node module package path with node module not in detectedNodeModules", () => {
      const helloControllerCode = dedent`
        import { Modal } from "some-unknown-package"

        export default class extends ApplicationController {}
      `

      const helloControllerFile = new SourceFile("app/javascript/hello_controller.js", helloControllerCode, project)
      helloControllerFile.analyze()

      expect(helloControllerFile.importDeclarations.length).toEqual(1)
      expect(helloControllerFile.importDeclarations[0].resolvedPath).toBeUndefined()
    })
  })
})

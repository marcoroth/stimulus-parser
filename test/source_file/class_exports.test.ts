import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject()

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject()
  })

  describe("class exports", () => {
    test("export named class", async () => {
      const code = dedent`
        class Something {}
        export { Something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeFalsy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeUndefined()
    })

    test("import and export named class", async () => {
      const code = dedent`
        import { SuperClass } from "./super_class"

        class Something extends SuperClass {}

        export { Something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeFalsy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeFalsy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeUndefined()
      expect(something.superClassName).toEqual("SuperClass")
    })

    test("import and export named Controller", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export { Something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and export named Controller with alias", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export { Something as SomethingController }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("SomethingController")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and export named class in-line", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and export default Controller", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export default Something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toBeUndefined()
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and export default Controller in single statement", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export default class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toBeUndefined()
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and export default anonymous Controller class in single statement", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export default class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toBeUndefined()
      expect(sourceFile.exportDeclarations[0].localName).toBeUndefined()
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")

      const something = sourceFile.findClass(undefined)

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and default export anonymous class assinged to const", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        const Something = class extends Controller {}

        export default Something
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toBeUndefined()
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("default")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and name export anonymous class assigned to const", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        const Something = class extends Controller {}

        export { Something }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and name export anonymous class assigned to const inline", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        export const Something = class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("Something")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.className).toEqual("Controller")
    })

    test("import and name export anonymous class assigned to const via class declaration", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}
        const AnotherThing = class extends Something {}

        export { AnotherThing }
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.importDeclarations.length).toEqual(1)
      expect(sourceFile.importDeclarations[0].isStimulusImport).toBeTruthy()

      expect(sourceFile.exportDeclarations.length).toEqual(1)
      expect(sourceFile.exportDeclarations[0].isStimulusExport).toBeTruthy()
      expect(sourceFile.exportDeclarations[0].exportedName).toEqual("AnotherThing")
      expect(sourceFile.exportDeclarations[0].localName).toEqual("AnotherThing")
      expect(sourceFile.exportDeclarations[0].type).toEqual("named")

      const anotherThing = sourceFile.findClass("AnotherThing")
      const something = sourceFile.findClass("Something")

      expect(anotherThing).toBeDefined()
      expect(something).toBeDefined()

      expect(anotherThing.superClass).toBeDefined()
      expect(something.superClass).toBeDefined()

      expect(anotherThing.superClass.className).toEqual("Something")
      expect(something.superClass.className).toEqual("Controller")
    })
  })
})

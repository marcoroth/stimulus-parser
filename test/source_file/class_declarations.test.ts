import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { Project, SourceFile, StimulusControllerClassDeclaration } from "../../src"

let project = new Project(process.cwd())

describe("SourceFile", () => {
  beforeEach(() => {
    project = new Project(process.cwd())
  })

  describe("classDeclarations", () => {
    test("named class", async () => {
      const code = dedent`
        class Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.isStimulusDescendant).toBeFalsy()
      expect(something.superClass).toBeUndefined()
    })

    test("multiple classes", async () => {
      const code = dedent`
        class Something {}
        class Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")
      const better = sourceFile.findClass("Better")

      expect(something).toBeDefined()
      expect(better).toBeDefined()

      expect(something.isStimulusDescendant).toBeFalsy()
      expect(better.isStimulusDescendant).toBeFalsy()

      expect(something.superClass).toBeUndefined()
      expect(better.superClass).toBeUndefined()
    })

    test("anonymous class", async () => {
      const code = dedent`
        export default class {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const anonymous = sourceFile.findClass(undefined)
      expect(anonymous.superClass).toBeUndefined()
    })

    test("anonymous class with extends", async () => {
      const code = dedent`
        class Something {}
        export default class extends Something {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const anonymous = sourceFile.findClass(undefined)
      const something = sourceFile.findClass("Something")

      expect(anonymous).toBeDefined()
      expect(something).toBeDefined()

      expect(anonymous.isStimulusDescendant).toBeFalsy()
      expect(something.isStimulusDescendant).toBeFalsy()

      expect(anonymous.superClass).toBeDefined()
      expect(anonymous.superClass).toEqual(something)

      expect(something.superClass).toBeUndefined()
    })

    test("named class with superclass", async () => {
      const code = dedent`
        class Better {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")
      const better = sourceFile.findClass("Better")

      expect(something).toBeDefined()
      expect(better).toBeDefined()

      expect(something.isStimulusDescendant).toBeFalsy()
      expect(better.isStimulusDescendant).toBeFalsy()

      expect(something.superClass).toBeDefined()
      expect(something.superClass).toEqual(better)

      expect(better.superClass).toBeUndefined()
    })

    test("named class with superclass from import", async () => {
      const code = dedent`
        import { Controller } from "better"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.isStimulusDescendant).toBeFalsy()
      expect(something).not.toBeInstanceOf(StimulusControllerClassDeclaration)

      expect(something.superClass).toBeUndefined()
      expect(something.superClass).not.toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("named class with superclass from Stimulus Controller import", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Something extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.isStimulusDescendant).toBeTruthy()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.isStimulusDescendant).toBeTruthy()
      expect(something.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("anonymous class assigned to variable from Stimulus Controller import", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        const Something = class extends Controller {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")

      expect(something).toBeDefined()
      expect(something.isStimulusDescendant).toBeTruthy()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.isStimulusDescendant).toBeTruthy()
      expect(something.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("anonymous class (ClassExpression) as argument to function call", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"

        application.register(class extends Controller {
          connect() {}
          disconnect() {}
        })
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      expect(sourceFile.classDeclarations).toHaveLength(1)

      const something = sourceFile.classDeclarations[0]

      expect(something).toBeDefined()
      expect(something.isStimulusDescendant).toBeTruthy()
      expect(something.superClass).toBeDefined()
      expect(something.superClass.isStimulusDescendant).toBeTruthy()
      expect(something.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
      expect(something.controllerDefinition.actionNames).toEqual(["connect", "disconnect"])
    })

    test("named class with superclass from import via second class", async () => {
      const code = dedent`
        import { Controller } from "@hotwired/stimulus"
        class Even extends Controller {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")
      const better = sourceFile.findClass("Better")
      const even = sourceFile.findClass("Even")

      expect(something).toBeDefined()
      expect(better).toBeDefined()
      expect(even).toBeDefined()

      expect(something.isStimulusDescendant).toBeTruthy()
      expect(better.isStimulusDescendant).toBeTruthy()
      expect(even.isStimulusDescendant).toBeTruthy()

      expect(something.superClass).toBeDefined()
      expect(something.superClass).toEqual(better)

      expect(better.superClass).toBeDefined()
      expect(better.superClass).toEqual(even)

      expect(even.superClass).toBeDefined()
      expect(even.superClass.isStimulusDescendant).toBeTruthy()
      expect(even.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })

    test("named class with superclass from import rename via second class", async () => {
      const code = dedent`
        import { Controller as StimulusController } from "@hotwired/stimulus"
        class Even extends StimulusController {}
        class Better extends Even {}
        class Something extends Better {}
      `

      const sourceFile = new SourceFile(project, "abc.js", code)
      project.projectFiles.push(sourceFile)

      await project.analyze()

      const something = sourceFile.findClass("Something")
      const better = sourceFile.findClass("Better")
      const even = sourceFile.findClass("Even")

      expect(something).toBeDefined()
      expect(better).toBeDefined()
      expect(even).toBeDefined()

      expect(something.isStimulusDescendant).toBeTruthy()
      expect(better.isStimulusDescendant).toBeTruthy()
      expect(even.isStimulusDescendant).toBeTruthy()

      expect(something.superClass).toBeDefined()
      expect(something.superClass).toEqual(better)

      expect(better.superClass).toBeDefined()
      expect(better.superClass).toEqual(even)

      expect(even.superClass).toBeDefined()
      expect(even.superClass.isStimulusDescendant).toBeTruthy()
      expect(even.superClass).toBeInstanceOf(StimulusControllerClassDeclaration)
    })
  })
})

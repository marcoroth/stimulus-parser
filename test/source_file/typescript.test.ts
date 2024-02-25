import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"
import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject("app")

describe("SourceFile", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  describe("TypeScript syntax", () => {
    test("ignores TSTypeAnnotation", async () => {
      const code = dedent`
        const greeting: string = "Hello World!"

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSTypeAnnotation as const", async () => {
      const code = dedent`
        const abc = [] as const

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSAsExpression", async () => {
      const code = dedent`
        const abc: string = 1 as string

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSModuleDeclaration kind=global", async () => {
      const code = dedent`
        declare global {}

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSModuleDeclaration kind=namespace", async () => {
      const code = dedent`
        namespace MyNamespace {}

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSTypeAliasDeclaration", async () => {
      const code = dedent`
        type MyType = {
          abc?: string
        }

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSInterfaceDeclaration", async () => {
      const code = dedent`
        interface MyInterface {
          abc?: string
        }

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSSatisfiesExpression", async () => {
      const code = dedent`
        const abc: string = 1 satisfies string

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSTypeAssertion", async () => {
      const code = dedent`
        let something: any = 123;
        let number = <number> something;

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })

    test("ignores TSAbstractMethodDefinition", async () => {
      const code = dedent`
        abstract class Person {
          abstract find(string): Person;
        }

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(2)
    })

    test("ignores TSTypeParameterDeclaration", async () => {
      const code = dedent`
        function generic<T>(items: T[]): T[] {
          return new Array<T>().concat(items)
        }

        class Test {}
      `

      const controllerFile = new SourceFile(project, "hello_controller.ts", code)
      project.projectFiles.push(controllerFile)

      await project.analyze()

      expect(controllerFile.errors.length).toEqual(0)
      expect(controllerFile.classDeclarations.length).toEqual(1)
    })
  })
})

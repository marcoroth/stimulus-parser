import { simple } from "acorn-walk"

import type { Project } from "./project"
import type { SourceFile } from "./source_file"
import type { ImportDeclaration } from "./import_declaration"
import { RegisteredController } from "./registered_controller"

export class ControllersIndexFile {
  public readonly project: Project
  public readonly registeredControllers: RegisteredController[] = []
  public readonly sourceFile: SourceFile

  public readonly fallbackPath: string = "app/javascript/controllers/index.js"

  constructor(project: Project, sourceFile: SourceFile){
    this.project = project
    this.sourceFile = sourceFile
  }

  get path() {
    return this.sourceFile.path
  }

  get applicationImport(): ImportDeclaration | undefined {
    return this.sourceFile.importDeclarations.find(declaration =>
      declaration.originalName === this.project.applicationFile?.exportDeclaration?.exportedName
    )
  }

  analyze() {
    simple(this.sourceFile.ast as any, {
      CallExpression: node => {
        const { callee } = node

        if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.property.type === "Identifier") {
          const { object, property } = callee

          const objectName = object.name
          const propertyName = property.name

          if (objectName !== this.applicationImport?.localName) return

          if (propertyName === "load") {
            // TODO
          }

          if (propertyName === "register") {
            const [identifierNode, controllerNode] = node.arguments.slice(0, 2)
            const identifier = (identifierNode.type === "Literal") ? identifierNode.value?.toString() : null
            const controllerName = (controllerNode.type === "Identifier") ? controllerNode.name : null

            if (!identifier || !controllerName) return // TODO: probably should add an error here

            const importDeclaration = this.sourceFile.findImport(controllerName)
            if (!importDeclaration) return // TODO: probably should add an error here

            const classDeclaration = importDeclaration.resolvedClassDeclaration
            if (!classDeclaration) return // TODO: probably should add an error here

            const controller = classDeclaration.controllerDefinition
            if (!controller) return // TODO: probably should add an error here

            this.registeredControllers.push(new RegisteredController(identifier, controller))
          }
        }
      }
    })
  }
}

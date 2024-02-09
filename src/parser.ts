import { simple } from "acorn-walk"
import * as ESLintParser from "@typescript-eslint/typescript-estree"

import { Project } from "./project"
import { ControllerDefinition, defaultValuesForType } from "./controller_definition"
import { NodeElement, PropertyValue } from "./types"

type NestedArray<T> = T | NestedArray<T>[]
type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

export class Parser {
  private readonly project: Project
  private parser: typeof ESLintParser

  constructor(project: Project) {
    this.project = project
    this.parser = ESLintParser
  }

  parse(code: string, filename?: string) {
    return this.parser.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
      filePath: filename
    })
  }

  parseController(code: string, filename: string) {
    try {
      const importStatements = []
      const ast = this.parse(code, filename)
      const controller = new ControllerDefinition(this.project, filename)

      simple(ast as any, {
        ImportDeclaration(node: any): void {
          node.specifiers.map((specifier: any) => {
            importStatements.push({
              originalName: specifier.imported?.name,
              importedName: specifier.local.name,
              source: node.source.value
            })
          })
        },

        ClassDeclaration(node: any): void {
          const superClass = node.superClass.name
          const importStatement = importStatements.find(i => i.importedName === superClass)

          if (importStatement) {
            controller.parent = {
              constant: superClass,
              package: importStatement.source,
              type: (importStatement.source === "@hotwired/stimulus" && importStatement.originalName === "Controller") ? "default" : "import",
            }
          } else {
            controller.parent = {
              constant: node.superClass.name,
              type: "unknown",
            }
          }
        },

        MethodDefinition(node: any): void {
          if (node.kind === "method") {
            const methodName = node.key.name
            const isPrivate = node.accessibility === "private" || node.key.type === "PrivateIdentifier"
            const name = isPrivate ? `#${methodName}` : methodName

            controller.methods.push(name)
          }
        },

        PropertyDefinition(node: any): void {
          const { name } = node.key

          if (node.value && node.value.type === "ArrowFunctionExpression") {
            controller.methods.push(name)
          }

          if (name === "targets") {
            controller.targets = node.value.elements.map((element: NodeElement) => element.value)
          }

          if (name === "classes") {
            controller.classes = node.value.elements.map((element: NodeElement) => element.value)
          }

          if (name === "values") {
            node.value.properties.forEach((property: NodeElement) => {
              const value = property.value

              let type
              let defaultValue

              if (value.name && typeof value.name === "string") {
                type = value.name
                defaultValue = defaultValuesForType[type]
              } else {
                const properties = property.value.properties

                const convertArrayExpression = (
                  value: NodeElement | PropertyValue
                ): NestedArray<PropertyValue> => {
                  return value.elements.map((node) => {
                    if (node.type === "ArrayExpression") {
                      return convertArrayExpression(node)
                    } else {
                      return node.value
                    }
                  })
                }

                const convertObjectExpression = (
                  value: PropertyValue
                ): NestedObject<PropertyValue> => {
                  return Object.fromEntries(
                    value.properties.map((property) => {
                      const value =
                        property.value.type === "ObjectExpression"
                          ? convertObjectExpression(property.value)
                          : property.value.value

                      return [property.key.name, value]
                    })
                  )
                }

                const convertProperty = (value: PropertyValue) => {
                  switch (value.type) {
                    case "ArrayExpression":
                      return convertArrayExpression(value)
                    case "ObjectExpression":
                      return convertObjectExpression(value)
                  }
                }

                const typeProperty = properties.find((property) => property.key.name === "type")
                const defaultProperty = properties.find((property) => property.key.name === "default")

                type = typeProperty?.value.name || ""
                defaultValue = defaultProperty?.value.value

                if (!defaultValue && defaultProperty) {
                  defaultValue = convertProperty(defaultProperty.value)
                }
              }

              controller.values[property.key.name] = {
                type: type,
                default: defaultValue,
              }
            })
          }
        },
      })

      return controller
    } catch(error: any) {
      console.error(`Error while parsing controller in '${filename}': ${error.message}`)

      const controller = new ControllerDefinition(this.project, filename)

      controller.parseError = error.message

      return controller
    }
  }
}

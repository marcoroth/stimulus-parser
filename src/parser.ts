import { simple } from "acorn-walk"
import { Parser as AcornParser } from "acorn"
import staticClassFeatures from "acorn-static-class-features"
import privateMethods from "acorn-private-methods"
import classFields from "acorn-class-fields"

import { Project } from "./project"
import { ControllerDefinition, defaultValuesForType } from "./controller_definition"
import { NodeElement, PropertyValue } from "./types"

type NestedArray<T> = T | NestedArray<T>[]
type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

export class Parser {
  private readonly project: Project
  private parser: typeof AcornParser

  constructor(project: Project) {
    this.project = project
    this.parser = AcornParser
      .extend(staticClassFeatures)
      .extend(privateMethods)
      .extend(classFields)
  }

  parse(code: string) {
    return this.parser.parse(code, {
      sourceType: "module",
      ecmaVersion: 2020,
    })
  }

  parseController(code: string, filename: string) {
    try {
      const ast = this.parse(code)
      const controller = new ControllerDefinition(this.project, filename)

      simple(ast, {
        MethodDefinition(node: any): void {
          if (node.kind === "method") {
            controller.methods.push(node.key.name)
          }
        },

        PropertyDefinition(node: any): void {
          const { name } = node.key

          if (node.value.type === "ArrowFunctionExpression") {
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

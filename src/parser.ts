import { simple } from "acorn-walk"
import * as ESLintParser from "@typescript-eslint/typescript-estree"

import { SourceFile } from "./source_file"
import { ParseError } from "./parse_error"
import { Project } from "./project"
import { ControllerDefinition, defaultValuesForType } from "./controller_definition"
import type { NodeElement, PropertyValue, ParserOptions, ImportDeclaration } from "./types"

type ClassDeclaration = {
  className: string
  superClass?: string
  isStimulusClass: boolean
}

type NestedArray<T> = T | NestedArray<T>[]
type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

export class Parser {
  private parser = ESLintParser
  private readonly project: Project
  private readonly parserOptions: ParserOptions = {
    loc: true,
    range: true,
    tokens: true,
    comment: true,
    sourceType: "module",
    ecmaVersion: "latest"
  }

  constructor(project: Project) {
    this.project = project
  }

  parse(code: string, filename?: string) {
    return this.parser.parse(code, {
      ...this.parserOptions,
      filePath: filename
    })
  }

  parseSourceFile(_sourceFile: SourceFile): ControllerDefinition[] {
    return []
  }

  parseController(code: string, filename: string): ControllerDefinition {
    try {
      const importDeclarations: ImportDeclaration[] = []
      const classDeclarations: ClassDeclaration[] = []

      const ast = this.parse(code, filename)
      const controller = new ControllerDefinition(this.project, filename)

      simple(ast as any, {
        ImportDeclaration(node: any): void {
          node.specifiers.map((specifier: any) => {
            importDeclarations.push({
              originalName: specifier.imported?.name,
              localName: specifier.local.name,
              source: node.source.value,
              isStimulusImport: false,
              node: node
            })
          })
        },

        ClassDeclaration(node: any): void {
          const className = node.id?.name
          const superClass = node.superClass?.name
          const importDeclaration = importDeclarations.find(i => i.localName === superClass)

          // TODO: this needs to be recursive
          const isStimulusClass = importDeclaration ? (importDeclaration.source === "@hotwired/stimulus" && importDeclaration.originalName === "Controller") : false

          classDeclarations.push({
            className,
            superClass,
            isStimulusClass
          })

          if (importDeclaration) {
            controller.parent = {
              constant: superClass,
              package: importDeclaration.source,
              type: isStimulusClass ? "default" : "import",
            }
          } else {
            controller.parent = {
              constant: superClass,
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

        ExpressionStatement(node: any): void {
          const left = node.expression.left
          const right = node.expression.right

          if (node.expression.type === "AssignmentExpression" && left.type === "MemberExpression" && left.object.type === "Identifier") {
            const classDeclaration = classDeclarations.find(c => c.className === left.object.name)

            if (classDeclaration && classDeclaration.isStimulusClass) {
              if (right.type === "ArrayExpression") {
                const values = right.elements.map((element: NodeElement) => element.value)

                if (left.property.name === "targets") {
                  controller.targets = values
                }

                if (left.property.name === "classes" && right.type === "ArrayExpression") {
                  controller.classes = values
                }
              }

              if (left.property.name === "values" && right.type === "ObjectExpression") {
                // TODO
              }
            }
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
                const properties = property.value.properties || []

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

      controller.errors.push(new ParseError("FAIL", "Error parsing controller", null, error))

      return controller
    }
  }
}

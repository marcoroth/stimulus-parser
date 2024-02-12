import * as ESLintParser from "@typescript-eslint/typescript-estree"

import { simple } from "acorn-walk"

import { Project } from "./project"
import { ParseError } from "./parse_error"
import { ControllerDefinition } from "./controller_definition"
import { ControllerPropertyDefinition, MethodDefinition, ValueDefinition, ClassDefinition, TargetDefinition } from "./controller_property_definition"
import { NodeElement, PropertyValue } from "./types"

type ImportStatement = {
  originalName?: string
  importedName: string
  source: string
}

type ClassDeclaration = {
  className: string
  superClass?: string
  isStimulusClass: boolean
}

type NestedArray<T> = T | NestedArray<T>[]
type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

// TODO: Support decorator + reflect-metadata value definitions
// TODO: error or multiple classes

export class Parser {
  private readonly project: Project
  private parser: typeof ESLintParser

  constructor(project: Project) {
    this.project = project
    this.parser = ESLintParser
  }

  parse(code: string, filename?: string) {
    return this.parser.parse(code, {
      loc: true,
      range: true,
      tokens: true,
      comment: true,
      sourceType: "module",
      ecmaVersion: "latest",
      filePath: filename
    })
  }

  parseController(code: string, filename: string) {
    try {
      const importStatements: ImportStatement[] = []
      const classDeclarations: ClassDeclaration[] = []

      const ast = this.parse(code, filename)
      const controller = new ControllerDefinition(this.project, filename)

      const parser = this

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
          const className = node.id?.name
          const superClass = node.superClass.name
          const importStatement = importStatements.find(i => i.importedName === superClass)

          // TODO: this needs to be recursive
          const isStimulusClass = importStatement ? (importStatement.source === "@hotwired/stimulus" && importStatement.originalName === "Controller") : false

          classDeclarations.push({
            className,
            superClass,
            isStimulusClass
          })

          if (importStatement) {
            controller.parent = {
              constant: superClass,
              package: importStatement.source,
              type: isStimulusClass ? "default" : "import",
            }
          } else {
            controller.parent = {
              constant: node.superClass.name,
              type: "unknown",
            }
          }

          if ("decorators" in node && Array.isArray(node.decorators)) {
            controller.isTyped = !!node.decorators.find(
              (decorator: any) => decorator.expression.name === "TypedController",
            )
          }
        },

        MethodDefinition(node: any): void {
          if (node.kind === "method") {
            const methodName = node.key.name
            const isPrivate = node.accessibility === "private" || node.key.type === "PrivateIdentifier"
            const name = isPrivate ? `#${methodName}` : methodName

            controller._methods.push(new MethodDefinition(name, node.loc, "static"))
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
          if ("decorators" in node && Array.isArray(node.decorators) && node.decorators.length > 0) {
            return parser.parseDecoratedProperty(controller, node)
          }

          if (node.value?.type === "ArrowFunctionExpression") {
            controller._methods.push(new MethodDefinition(node.key.name, node.loc, "static"))
          }

          if (!node.static) return

          parser.parseProperty(controller, node)
        },
      })

      this.validate(controller)

      return controller
    } catch (error: any) {
      console.error(`Error while parsing controller in '${filename}': ${error.message}`)

      const controller = new ControllerDefinition(this.project, filename)

      controller.errors.push(new ParseError("FAIL", "Error parsing controller", null, error))

      return controller
    }
  }

  public validate(controller: ControllerDefinition) {
    if (controller.anyDecorator && !controller.isTyped) {
      controller.errors.push(
        new ParseError("LINT", "You need to decorate the controller with @TypedController to use decorators"),
      )
    }

    if (!controller.anyDecorator && controller.isTyped) {
      controller.errors.push(
        new ParseError("LINT", "You decorated the controller with @TypedController to use decorators"),
      )
    }

    this.uniqueErrorGenerator(controller, "target", controller._targets)
    this.uniqueErrorGenerator(controller, "class", controller._classes)
    // values are reported at the time of parsing since we're storing them as an object
  }

  private uniqueErrorGenerator(controller: ControllerDefinition, type: string, items: ControllerPropertyDefinition[]) {
    const errors: string[] = []

    items.forEach((item, index) => {
      if (errors.includes(item.name)) return

      items.forEach((item2, index2) => {
        if (index2 === index) return

        if (item.name === item2.name) {
          errors.push(item.name)
          controller.errors.push(new ParseError("LINT", `Duplicate definition of ${type}:${item.name}`, item2.loc))
        }
      })
    })
  }

  public parseDecoratedProperty(controller: ControllerDefinition, node: any) {
    const { name } = node.key

    node.decorators.forEach((decorator: any) => {
      switch (decorator.expression.name || decorator.expression.callee.name) {
        case "Target":
        case "Targets":
          controller.anyDecorator = true
          return controller._targets.push(
            new TargetDefinition(this.stripDecoratorSuffix(name, "Target"), node.loc, "decorator"),
          )
        case "Class":
        case "Classes":
          controller.anyDecorator = true
          return controller._classes.push(
            new ClassDefinition(this.stripDecoratorSuffix(name, "Class"), node.loc, "decorator"),
          )
        case "Value":
          controller.anyDecorator = true
          if (decorator.expression.name !== undefined || decorator.expression.arguments.length !== 1) {
            throw new Error("We dont support reflected types yet")
          }

          const key = this.stripDecoratorSuffix(name, "Value")
          const type = decorator.expression.arguments[0].name

          if (controller._values[key]) {
            controller.errors.push(new ParseError("LINT", `Duplicate definition of value:${key}`, node.loc))
          }

          const defaultValue = {
            type,
            default: node.value ? this.getDefaultValueFromNode(node) : ValueDefinition.defaultValuesForType[type],
          }

          controller._values[key] = new ValueDefinition(key, defaultValue, node.loc, "decorator")
      }
    })
  }

  private stripDecoratorSuffix(name: string, type: string) {
    return name.slice(0, name.indexOf(type))
  }

  public parseProperty(controller: ControllerDefinition, node: any) {
    switch (node.key.name) {
      case "targets":
        return controller._targets.push(
          ...node.value.elements.map((element: any) => new TargetDefinition(element.value, node.loc, "static")),
        )
      case "classes":
        return controller._classes.push(
          ...node.value.elements.map((element: any) => new ClassDefinition(element.value, node.loc, "static")),
        )
      case "values":
        node.value.properties.forEach((property: NodeElement) => {
          if (controller._values[property.key.name]) {
            controller.errors.push(
              new ParseError("LINT", `Duplicate definition of value:${property.key.name}`, node.loc),
            )
          }

          controller._values[property.key.name] = new ValueDefinition(
            property.key.name,
            this.parseValuePropertyDefinition(property),
            node.loc,
            "static",
          )
        })
    }
  }

  private parseValuePropertyDefinition(property: NodeElement): { type: any; default: any } {
    const { value } = property
    if (value.name && typeof value.name === "string") {
      return {
        type: value.name,
        default: ValueDefinition.defaultValuesForType[value.name],
      }
    }

    const properties = property.value.properties

    const typeProperty = properties.find((property) => property.key.name === "type")
    const defaultProperty = properties.find((property) => property.key.name === "default")

    return {
      type: typeProperty?.value.name || "",
      default: this.getDefaultValueFromNode(defaultProperty),
    }
  }

  private convertArrayExpression(value: NodeElement | PropertyValue): NestedArray<PropertyValue> {
    return value.elements.map((node) => {
      if (node.type === "ArrayExpression") {
        return this.convertArrayExpression(node)
      } else {
        return node.value
      }
    })
  }

  private convertObjectExpression(value: PropertyValue): NestedObject<PropertyValue> {
    return Object.fromEntries(
      value.properties.map((property) => {
        const isObjectExpression = property.value.type === "ObjectExpression"
        const value = isObjectExpression ? this.convertObjectExpression(property.value) : property.value.value

        return [property.key.name, value]
      })
    )
  }

  private getDefaultValueFromNode(node: any) {
    if ("value" in node.value) {
      return node.value.value
    }

    const value = node.value

    switch (value.type) {
      case "ArrayExpression":
        return this.convertArrayExpression(value)
      case "ObjectExpression":
        return this.convertObjectExpression(value)
    }
  }
}

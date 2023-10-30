import { Parser as AcornParser } from "acorn"
import { simple } from "acorn-walk"
import { tsPlugin } from "acorn-typescript"

import { Project } from "./project"
import { ControllerDefinition, defaultValuesForType } from "./controller_definition"
import { NodeElement, PropertyValue } from "./types"

// TODO: Support decorator + reflect-metadata value definitions
class ControllerParser {
  constructor(public controller: ControllerDefinition) {}

  public parseDecoratedProperty(node: any) {
    const { name } = node.key

    node.decorators.forEach((decorator: any) => {
      switch (decorator.expression.name || decorator.expression.callee.name) {
        case "Target":
        case "Targets":
          return this.controller.targets.push(this.stripDecoratorSuffix(name, "Target"))
        case "Class":
        case "Classes":
          return this.controller.classes.push(this.stripDecoratorSuffix(name, "Class"))
        case "Value":
          if (decorator.expression.name !== undefined || decorator.expression.arguments.length !== 1) {
            throw new Error("We dont support reflected types yet")
          }

          const key = this.stripDecoratorSuffix(name, "Value")
          const type = decorator.expression.arguments[0].name

          this.controller.values[key] = {
            type,
            default: node.value ? this.getDefaultValueFromNode(node) : defaultValuesForType[type],
          }
      }
    })
  }

  private stripDecoratorSuffix(name: string, type: string) {
    return name.slice(0, name.indexOf(type))
  }

  public parseProperty(node: any) {
    switch (node.key.name) {
      case "targets":
        return this.controller.targets.push(...node.value.elements.map((element: any) => element.value))
      case "classes":
        return this.controller.classes.push(...node.value.elements.map((element: NodeElement) => element.value))
      case "values":
        node.value.properties.forEach((property: NodeElement) => {
          this.controller.values[property.key.name] = this.parseValuePropertyDefinition(property)
        })
    }
  }

  private parseValuePropertyDefinition(property: NodeElement): { type: any; default: any } {
    const { value } = property
    if (value.name && typeof value.name === "string") {
      return {
        type: value.name,
        default: defaultValuesForType[value.name],
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

  private getDefaultValueFromNode(node: any) {
    if ("value" in node.value) {
      return node.value.value
    }

    const value = node.value

    const convertArrayExpression = (value: PropertyValue) => {
      return value.elements.map((node) => node.value)
    }

    const convertObjectExpression = (value: PropertyValue) => {
      return Object.fromEntries(value.properties.map((property) => [property.key.name, property.value.value]))
    }

    switch (value.type) {
      case "ArrayExpression":
        return convertArrayExpression(value)
      case "ObjectExpression":
        return convertObjectExpression(value)
    }
  }
}

// TODO: make sure to show an error if there are duplicate targets
// TODO: make sure to error out if there are decorators and no TypedController
// TODO: error or multiple classes
export class Parser {
  private readonly project: Project
  private parser: typeof AcornParser

  constructor(project: Project) {
    this.project = project

    // @ts-expect-error TODO(Zeko369): Figure out TS error when loading tsPlugin
    this.parser = AcornParser.extend(tsPlugin())
  }

  parse(code: string) {
    return this.parser.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
    })
  }

  parseController(code: string, filename: string) {
    try {
      const ast = this.parse(code)
      const controllerParser = new ControllerParser(new ControllerDefinition(this.project, filename))

      simple(ast, {
        MethodDefinition(node: any): void {
          if (node.kind === "method") {
            controllerParser.controller.methods.push(node.key.name)
          }
        },
        ClassDeclaration(node: any): void {
          if ("decorators" in node && Array.isArray(node.decorators)) {
            controllerParser.controller.isTyped = !!node.decorators.find(
              (decorator: any) => decorator.expression.name === "TypedController",
            )
          }
        },
        PropertyDefinition(node: any): void {
          if ("decorators" in node && Array.isArray(node.decorators) && node.decorators.length > 0) {
            return controllerParser.parseDecoratedProperty(node)
          }

          if (node.value?.type === "ArrowFunctionExpression") {
            controllerParser.controller.methods.push(node.key.name)
          }

          if (!node.static) return

          controllerParser.parseProperty(node)
        },
      })

      return controllerParser.controller
    } catch (error: any) {
      console.error(`Error while parsing controller in '${filename}': ${error.message}`)

      const controller = new ControllerDefinition(this.project, filename)

      controller.parseError = error.message

      return controller
    }
  }
}

import * as ESLintParser from "@typescript-eslint/typescript-estree"

import { SourceLocation } from "acorn"
import { simple } from "acorn-walk"

import { Project } from "./project"
import { ParseError } from "./parse_error"
import { ControllerDefinition, Definition, ValueDefinition } from "./controller_definition"
import { NodeElement, PropertyValue } from "./types"

type ImportStatement = {
  originalName?: string
  importedName: string
  source: string
}

type NestedArray<T> = T | NestedArray<T>[]
type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

// TODO: Support decorator + reflect-metadata value definitions
class ControllerParser {
  loc?: SourceLocation

  constructor(public controller: ControllerDefinition) {}

  public validate() {
    if (this.controller.anyDecorator && !this.controller.isTyped) {
      this.controller.errors.push(
        new ParseError("LINT", "You need to decorate the controller with @TypedController to use decorators", this.loc),
      )
    }

    this.uniqueErrorGenerator("target", this.controller._targets)
    this.uniqueErrorGenerator("class", this.controller._classes)
    // values are reported at the time of parsing since we're storing them as an object
  }

  private uniqueErrorGenerator(type: string, items: Definition[]) {
    const errors: string[] = []
    items.forEach((item, index) => {
      if (errors.includes(item.name)) {
        return
      }

      items.forEach((item2, index2) => {
        if (index2 === index) {
          return
        }

        if (item.name === item2.name) {
          errors.push(item.name)
          this.controller.errors.push(new ParseError("LINT", `Duplicate definition of ${type}:${item.name}`, item2.loc))
        }
      })
    })
  }

  public parseDecoratedProperty(node: any) {
    const { name } = node.key

    node.decorators.forEach((decorator: any) => {
      switch (decorator.expression.name || decorator.expression.callee.name) {
        case "Target":
        case "Targets":
          this.controller.anyDecorator = true
          return this.controller._targets.push(
            new Definition(this.stripDecoratorSuffix(name, "Target"), node.loc, "decorator"),
          )
        case "Class":
        case "Classes":
          this.controller.anyDecorator = true
          return this.controller._classes.push(
            new Definition(this.stripDecoratorSuffix(name, "Class"), node.loc, "decorator"),
          )
        case "Value":
          this.controller.anyDecorator = true
          if (decorator.expression.name !== undefined || decorator.expression.arguments.length !== 1) {
            throw new Error("We dont support reflected types yet")
          }

          const key = this.stripDecoratorSuffix(name, "Value")
          const type = decorator.expression.arguments[0].name

          if (this.controller._values[key]) {
            this.controller.errors.push(new ParseError("LINT", `Duplicate definition of value:${key}`, node.loc))
          }

          this.controller._values[key] = new ValueDefinition(
            key,
            {
              type,
              default: node.value ? this.getDefaultValueFromNode(node) : ValueDefinition.defaultValuesForType[type],
            },
            node.loc,
            "decorator",
          )
      }
    })
  }

  private stripDecoratorSuffix(name: string, type: string) {
    return name.slice(0, name.indexOf(type))
  }

  public parseProperty(node: any) {
    switch (node.key.name) {
      case "targets":
        return this.controller._targets.push(
          ...node.value.elements.map((element: any) => new Definition(element.value, node.loc, "static")),
        )
      case "classes":
        return this.controller._classes.push(
          ...node.value.elements.map((element: any) => new Definition(element.value, node.loc, "static")),
        )
      case "values":
        node.value.properties.forEach((property: NodeElement) => {
          this.controller._values[property.key.name] = new ValueDefinition(
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

  private convertObjectExpression (value: PropertyValue): NestedObject<PropertyValue> {
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

// TODO: make sure to show an error if there are duplicate targets
// TODO: make sure to error out if there are decorators and no TypedController
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
      const ast = this.parse(code, filename)
      const controllerParser = new ControllerParser(new ControllerDefinition(this.project, filename))

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
            controllerParser.controller.parent = {
              constant: superClass,
              package: importStatement.source,
              type: (importStatement.source === "@hotwired/stimulus" && importStatement.originalName === "Controller") ? "default" : "import",
            }
          } else {
            controllerParser.controller.parent = {
              constant: node.superClass.name,
              type: "unknown",
            }
          }

          if ("decorators" in node && Array.isArray(node.decorators)) {
            controllerParser.controller.isTyped = !!node.decorators.find(
              (decorator: any) => decorator.expression.name === "TypedController",
            )
          }
        },

        MethodDefinition(node: any): void {
          if (node.kind === "method") {
            const methodName = node.key.name
            const isPrivate = node.accessibility === "private" || node.key.type === "PrivateIdentifier"
            const name = isPrivate ? `#${methodName}` : methodName

            controllerParser.controller._methods.push(new Definition(name, node.loc, "static"))
          }
        },

        PropertyDefinition(node: any): void {
          if ("decorators" in node && Array.isArray(node.decorators) && node.decorators.length > 0) {
            return controllerParser.parseDecoratedProperty(node)
          }

          if (node.value?.type === "ArrowFunctionExpression") {
            controllerParser.controller._methods.push(new Definition(node.key.name, node.loc, "static"))
          }

          // console.log(node)

          if (!node.static) return

          controllerParser.parseProperty(node)
        },
      })

      controllerParser.validate()

      return controllerParser.controller
    } catch (error: any) {
      console.error(`Error while parsing controller in '${filename}': ${error.message}`)

      const controller = new ControllerDefinition(this.project, filename)

      controller.errors.push(new ParseError("FAIL", "Error parsing controller", null, error))

      return controller
    }
  }
}

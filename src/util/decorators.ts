import { ValueDefinition, ClassDefinition, TargetDefinition } from "../controller_property_definition"
import { ControllerDefinition } from "../controller_definition"
import { ParseError } from "../parse_error"

import type * as Acorn from "acorn"
import type { TSESTree } from "@typescript-eslint/typescript-estree"
import type { ValueDefinition as ValueDefinitionType, ValueDefinitionValue } from "../types"

import * as ast from "./ast"

export function stripDecoratorSuffix(name: string, type: string) {
  return name.slice(0, name.indexOf(type))
}

export function extractDecorators(node: Acorn.AnyNode): TSESTree.Decorator[] {
  if ("decorators" in node && Array.isArray(node.decorators)) {
    return node.decorators
  } else {
    return []
  }
}

export function parseDecorator(controllerDefinition: ControllerDefinition | undefined, name: string, decorator: TSESTree.Decorator, node: TSESTree.PropertyDefinition): void {
  if (!controllerDefinition) return

  const identifierName = (decorator.expression.type === "Identifier") ? decorator.expression.name : undefined
  const calleeName = (decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier") ? decorator.expression.callee.name : undefined

  const decoratorName = identifierName || calleeName

  switch (decoratorName) {
    case "Target":
    case "Targets":
      parseTargetDecorator(controllerDefinition, name, node)
      break

    case "Class":
    case "Classes":
      parseClassDecorator(controllerDefinition, name, node)
      break

    case "Value":
      parseValueDecorator(controllerDefinition, name, decorator, node)

      break
  }
}

export function parseTargetDecorator(controllerDefinition: ControllerDefinition, name: string, node: TSESTree.PropertyDefinition): void {
  controllerDefinition.anyDecorator = true

  const targetDefinition = new TargetDefinition(stripDecoratorSuffix(name, "Target"), node.loc, "decorator")

  controllerDefinition.targets.push(targetDefinition)
}

export function parseClassDecorator(controllerDefinition: ControllerDefinition, name: string, node: TSESTree.PropertyDefinition): void {
  controllerDefinition.anyDecorator = true

  const classDefinition = new ClassDefinition(stripDecoratorSuffix(name, "Class"), node.loc, "decorator")

  controllerDefinition.classes.push(classDefinition)
}

export function parseValueDecorator(controllerDefinition: ControllerDefinition, name: string, decorator: TSESTree.Decorator, node: TSESTree.PropertyDefinition): void {
  controllerDefinition.anyDecorator = true

  const isIdentifier = (decorator.expression.type === "Identifier" && decorator.expression.name !== undefined)
  const hasOneArgument = (decorator.expression.type === "CallExpression" && decorator.expression.arguments.length === 1)

  if (isIdentifier || !hasOneArgument) {
    // TODO: Support decorator + reflect-metadata value definitions
    throw new Error("We dont support reflected types yet")
  }

  if (decorator.expression.type !== "CallExpression") return

  const key = stripDecoratorSuffix(name, "Value")
  const type = decorator.expression.arguments[0]

  if (controllerDefinition.values[key]) {
    controllerDefinition.errors.push(new ParseError("LINT", `Duplicate definition of value:${key}`, node.loc))
  }

  if (type.type !== "Identifier") return

  const defaultValue: ValueDefinitionValue = node.value ?
    ast.getDefaultValueFromNode(node.value as unknown as Acorn.Expression)
    : ValueDefinition.defaultValuesForType[type.name]

  const definition: ValueDefinitionType = {
    type: type.name,
    default: defaultValue
  }

  controllerDefinition.values[key] = new ValueDefinition(key, definition, node.loc, "decorator")
}

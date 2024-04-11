import { ValueDefinition, ClassDefinition, TargetDefinition } from "../controller_property_definition"
import { ControllerDefinition } from "../controller_definition"

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

  const decoratorName = identifierName || calleeName

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

  const targetDefinition = new TargetDefinition(stripDecoratorSuffix(name, "Target"), node as any, node.loc, "decorator")

  controllerDefinition.addTargetDefinition(targetDefinition)
}

export function parseClassDecorator(controllerDefinition: ControllerDefinition, name: string, node: TSESTree.PropertyDefinition): void {
  controllerDefinition.anyDecorator = true

  const classDefinition = new ClassDefinition(stripDecoratorSuffix(name, "Class"), node as any, node.loc, "decorator")

  controllerDefinition.addClassDefinition(classDefinition)
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

  if (type.type !== "Identifier") return

  const defaultValue: ValueDefinitionValue = node.value ?
    ast.getDefaultValueFromNode(node.value as unknown as Acorn.Expression)
    : ValueDefinition.defaultValuesForType[type.name]

  const definition: ValueDefinitionType = {
    type: type.name,
    default: defaultValue,
    kind: "decorator",
    keyLoc: decorator.loc,
    valueLoc: node.loc
  }

  const valueDefinition = new ValueDefinition(key, definition, node as any, node.loc, "decorator")

  controllerDefinition.addValueDefinition(valueDefinition)
}

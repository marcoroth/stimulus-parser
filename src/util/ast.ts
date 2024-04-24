import { ValueDefinition } from "../controller_property_definition"

import type * as Acorn from "acorn"
import type { NestedObject, ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "../types"

export function findPropertyInProperties(_properties: (Acorn.Property | Acorn.SpreadElement)[], propertyName: string): Acorn.Property | undefined {

  const properties = _properties.filter(property => property.type === "Property") as Acorn.Property[]

  return properties.find(property =>
    ((property.key.type === "Identifier") ? property.key.name : undefined) === propertyName
  )
}

export function convertArrayExpressionToLiterals(value: Acorn.ArrayExpression): Array<ValueDefinitionValue> {
  return value.elements.map(node => {
    if (!node) return

    switch (node.type) {
      case "ArrayExpression": return convertArrayExpressionToLiterals(node)
      case "Literal":         return extractLiteral(node)
      case "SpreadElement":   return // TODO: implement support for spreads
      default:                return
    }
  })
}

export function convertArrayExpressionToStrings(value: Acorn.ArrayExpression): string[] {
  return value.elements.map(node => {
    if (!node) return

    switch (node.type) {
      case "ArrayExpression": return convertArrayExpressionToStrings(node)
      case "Literal":         return node.value?.toString() ?? node.raw
      case "Identifier":      return node.name
      case "SpreadElement":   return // TODO: implement support for spreads
      default:                return
    }
  }).filter(value => value !== undefined) as string[]
}

export function convertObjectExpression(value: Acorn.ObjectExpression): NestedObject<ValueDefinitionValue> {
  const properties = value.properties.map(property => {
    if (property.type === "SpreadElement") return [] // TODO: implement support for spreads
    if (property.key.type !== "Identifier") return []

    const value =
      property.value.type === "ObjectExpression"
        ? convertObjectExpression(property.value)
        : extractLiteral(property.value)

    return [property.key.name, value]
  }).filter(property => property !== undefined)

  return Object.fromEntries(properties)
}

export function convertObjectExpressionToValueDefinitions(objectExpression: Acorn.ObjectExpression): [string, ValueDefinitionType][] {
  const definitions: [string, ValueDefinitionType][] = []

  objectExpression.properties.map(property => {
    if (property.type !== "Property") return
    if (property.key.type !== "Identifier") return

    const definition = convertPropertyToValueDefinition(property)

    if (definition) {
      definitions.push([property.key.name, definition])
    }
  })

  return definitions
}

export function convertObjectExpressionToValueDefinition(objectExpression: Acorn.ObjectExpression): ValueDefinitionType | undefined {
  const typeProperty = findPropertyInProperties(objectExpression.properties, "type")
  const defaultProperty = findPropertyInProperties(objectExpression.properties, "default")

  let type = undefined

  switch (typeProperty?.value?.type) {
    case "Identifier":
      type = typeProperty.value.name
      break;

    case "Literal":
      type = typeProperty.value?.toString()
      break
  }

  if (!type) return


  let defaultValue = getDefaultValueFromNode(defaultProperty?.value)

  return {
    type,
    default: defaultValue,
    kind: "expanded"
  }
}

export function convertPropertyToValueDefinition(property: Acorn.Property): ValueDefinitionType | undefined {
  switch (property.value.type) {
    case "Identifier":
      return {
        type: property.value.name,
        default: ValueDefinition.defaultValuesForType[property.value.name],
        kind: "shorthand"
      }
    case "ObjectExpression":
      return convertObjectExpressionToValueDefinition(property.value)
  }
}

export function getDefaultValueFromNode(node?: Acorn.Expression | null) {
  if (!node) return

  switch (node.type) {
    case "ArrayExpression":
      return convertArrayExpressionToLiterals(node)
    case "ObjectExpression":
      return convertObjectExpression(node)
    case "Literal":
      return node.value
    default:
      throw new Error(`node type ${node?.type}`)
  }
}

export function extractIdentifier(node?: Acorn.AnyNode | null): string | undefined {
  if (!node) return undefined
  if (!(node.type === "Identifier" || node.type === "PrivateIdentifier")) return undefined

  return node.name
}

type AcornLiteral = string | number | bigint | boolean | RegExp | null | undefined

export function extractLiteral(node?: Acorn.Expression | null): AcornLiteral {
  if (node?.type !== "Literal") return undefined

  return node.value
}

export function extractLiteralAsString(node?: Acorn.Expression | null): string | undefined {
  return extractLiteral(node)?.toString()
}

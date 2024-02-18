import { ValueDefinition } from "../controller_property_definition"

import { SourceFile } from "../source_file"
import { ParseError } from "../parse_error"
import { ClassDeclaration, StimulusControllerClassDeclaration } from "../class_declaration"

import type * as Acorn from "acorn"
import type { NestedObject, ValueDefinitionValue, ValueDefinition as ValueDefinitionType, ClassDeclarationNode } from "../types"
import type { ImportDeclaration } from "../import_declaration"
import type { Project } from "../project"

export function findPropertyInProperties(_properties: (Acorn.Property | Acorn.SpreadElement)[], propertyName: string): Acorn.Property | undefined {
  const properties = _properties.filter(property => property.type === "Property") as Acorn.Property[]

  return properties.find(property =>
    ((property.key.type === "Identifier") ? property.key.name : undefined) === propertyName
  )
}

export function convertArrayExpression(value: Acorn.ArrayExpression): Array<string> {
  return value.elements.map(node => {
    if (!node) return

    switch (node.type) {
      case "ArrayExpression": return convertArrayExpression(node)
      case "Literal":         return node.value?.toString()
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
  }
}

export function convertPropertyToValueDefinition(property: Acorn.Property): ValueDefinitionType | undefined {
  switch (property.value.type) {
    case "Identifier":
      return {
        type: property.value.name,
        default: ValueDefinition.defaultValuesForType[property.value.name]
      }
    case "ObjectExpression":
      return convertObjectExpressionToValueDefinition(property.value)
  }
}

export function getDefaultValueFromNode(node?: Acorn.Expression | null) {
  if (!node) return

  switch (node.type) {
    case "ArrayExpression":
      return convertArrayExpression(node)
    case "ObjectExpression":
      return convertObjectExpression(node)
    case "Literal":
      return node.value
    default:
      throw new Error(`node type ${node?.type}`)
  }
}

export function detectSuperClass(project: Project, className: string|undefined, node: ClassDeclarationNode, superClassName: string|undefined, importDeclaration: ImportDeclaration|undefined, errors: ParseError[]): ClassDeclaration|undefined {
  if (importDeclaration && importDeclaration.isStimulusImport) {
    return new StimulusControllerClassDeclaration(project, importDeclaration)
  }

  if (importDeclaration) {
    const nextClass = importDeclaration.nextResolvedClassDeclaration

    if (nextClass) return nextClass

    errors.push(new ParseError("FAIL", `Couldn't resolve import "${importDeclaration.localName}" to a class declaration in "${importDeclaration.source}". Make sure the referenced constant is defining a class.`, node.loc))
    return
  }

  if (!superClassName) return

  errors.push(new ParseError("FAIL", `Couldn't resolve super class "${superClassName}" for class "${className}". Double check your imports.`, node.loc))
}

export function convertClassDeclarationNodeToClassDeclaration(sourceFile: SourceFile, className: string | undefined, node: ClassDeclarationNode) {
  const errors: ParseError[] = []
  const superClassName = extractIdentifier(node.superClass)
  const importDeclaration = sourceFile.importDeclarations.find(i => i.localName === superClassName)

  let superClass = sourceFile.classDeclarations.find(i => i.className === superClassName)

  if (!superClass) {
    superClass = detectSuperClass(sourceFile.project, className, node, superClassName, importDeclaration, errors)
  }

  const classDeclaration = new ClassDeclaration(className, superClass, sourceFile, node)

  sourceFile.errors.push(...errors)
  sourceFile.classDeclarations.push(classDeclaration)
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

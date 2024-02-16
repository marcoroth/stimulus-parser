import * as Acorn from "acorn"

import {
  ArrayExpression,
  BlockStatement,
  CallExpression,
  ClassDeclaration,
  ExpressionStatement,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  Literal,
  MemberExpression,
  MethodDefinition,
  ObjectExpression,
  Property,
  PropertyDefinition,
} from "./ast_builder"

export function StimulusImport(): Acorn.ImportDeclaration {
  const importSpecifier = ImportSpecifier(
    Identifier("Controller"),
    Identifier("Controller")
  )

  return ImportDeclaration(
    [importSpecifier],
    Literal("@hotwired/stimulus")
  )
}

export function StimulusClassDeclaration(className?: string, superClass: string|undefined = "Controller"): Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration {
  return ClassDeclaration(
    className ? Identifier(className) : null,
    superClass ? Identifier(superClass) : undefined,
  )
}

export function EmptyMethodDefinition(key: string): Acorn.MethodDefinition {
  const memberExpression = MemberExpression(Identifier("console"), Identifier("log"))
  const callArguments = [Literal(key), Identifier("event")]
  const callExpression = CallExpression(memberExpression, callArguments)

  const blockStatement = BlockStatement([ExpressionStatement(callExpression)])
  const functionExpression = FunctionExpression([Identifier("event")], blockStatement)

  return MethodDefinition(Identifier(key), functionExpression)
}

export function TargetsProperty(...literals: string[]): Acorn.PropertyDefinition {
  return PropertyDefinition(
    Identifier("targets"),
    ArrayExpression(
      literals.map(literal => Literal(literal))
    )
  )
}

export function ClassesProperty(...literals: string[]): Acorn.PropertyDefinition {
  return PropertyDefinition(
    Identifier("classes"),
    ArrayExpression(
      literals.map(literal => Literal(literal))
    )
  )
}

export function ValuesProperty(...properties: ([string[], string[]])): Acorn.PropertyDefinition {
  const objectProperties = properties.map(props => {
    if (props.length === 2) {
      return Property(Identifier(props[0]), Identifier(props[1]))
    }

    return Property(
      Identifier(props[0]),
      ObjectExpression([
        Property(Identifier("type"), Identifier(props[1])),
        Property(Identifier("default"), Literal(props[2])),
      ])
    )
  })

  return PropertyDefinition(
    Identifier("values"),
    ObjectExpression(objectProperties)
  )
}

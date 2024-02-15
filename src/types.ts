import type * as Acorn from "acorn"

export type NestedArray<T> = T | NestedArray<T>[]

export type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

export type ValueDefinitionValue = string | number | bigint | boolean | object | null | undefined

export type ValueDefinition = {
  type: string
  default: ValueDefinitionValue
}

export type ValueDefinitionObject = { [key: string]: ValueDefinition }

export type ParserOptions = {
  loc: boolean
  range?: boolean
  tokens?: boolean
  comment?: boolean
  sourceType: string
  ecmaVersion: string
  filePath?: string
}

export type ClassDeclarationNode = Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration | Acorn.ClassExpression

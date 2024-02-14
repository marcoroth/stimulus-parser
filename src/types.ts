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

export interface NodeModule {
  entrypoint: string
  name: string
  path: string
  controllerRoots: string[]
  files: string[]
  type: "main" | "module" | "source"
}

export type ParserOptions = {
  loc: true
  range: true
  tokens: true
  comment: true
  sourceType: string
  ecmaVersion: string
  filePath?: string
}

export type ClassDeclarationNode = Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration | Acorn.ClassExpression

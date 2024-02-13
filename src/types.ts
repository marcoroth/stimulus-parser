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
  name: string
  path: string
  controllerRoots: string[]
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

export type ImportDeclaration = {
  originalName?: string
  localName: string
  source: string
  isStimulusImport: boolean
  node: Acorn.ImportDeclaration
}

export type ExportDeclaration = {
  localName?: string
  exportedName?: string
  source?: string
  type: "default" | "named" | "namespace"
  node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration
}

export type ClassDeclarationNode = Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration

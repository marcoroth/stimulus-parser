import type * as Acorn from "acorn"

export interface NodeElement {
  key: { name: string }
  value: PropertyValue
  properties: PropertyElement[]
  elements: NodeElement[]
  type: string
}

export interface PropertyValue {
  name: string
  value: PropertyValue
  raw: string
  properties: PropertyElement[]
  elements: NodeElement[]
  type: string
}

export interface PropertyElement {
  key: { name: string }
  value: PropertyValue
  properties: PropertyElement[]
}

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

export type ClassDeclaration = {
  className?: string
  superClass?: ClassDeclaration
  importDeclaration?: ImportDeclaration
  exportDeclaration?: ExportDeclaration
  isStimulusDescendant: boolean
}

export type IdentifiableNode =
  Acorn.Literal |
  Acorn.Pattern |
  Acorn.Declaration |
  Acorn.AnonymousFunctionDeclaration |
  Acorn.AnonymousClassDeclaration |
  Acorn.Expression |
  null |
  undefined

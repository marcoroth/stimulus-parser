import type { TSESTree } from "@typescript-eslint/typescript-estree"

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
  node: TSESTree.ImportDeclaration
}
}

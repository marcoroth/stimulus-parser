import type * as Acorn from "acorn"

export type NestedArray<T> = T | NestedArray<T>[]

export type NestedObject<T> = {
  [k: string]: T | NestedObject<T>
}

export type ValueDefinitionValue = string | number | bigint | boolean | object | null | undefined
export type ValueDefinitionKind = "expanded" | "inferred" | "shorthand" | "decorator"

export type ValueDefinition = {
  type: string
  default: ValueDefinitionValue
  kind: ValueDefinitionKind
}

export type ValueDefinitionObject = { [key: string]: ValueDefinition }

export type ClassDeclarationNode = Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration | Acorn.ClassExpression

export type ApplicationType =
  "esbuild" |
  "esbuild-rails" |
  "vite" |
  "vite-rails" |
  "vite-ruby" |
  "rollup" |
  "webpack" |
  "webpacker" |
  "shakapacker" |
  "importmap-rails"

export type ControllerLoadMode =
  "load" |
  "register" |
  "stimulus-loading-lazy" |
  "stimulus-loading-eager" |
  "esbuild-rails" |
  "stimulus-vite-helpers" |
  "stimulus-webpack-helpers"

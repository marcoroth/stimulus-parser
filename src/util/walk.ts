import { base, simple } from "acorn-walk"
import { visitorKeys } from "@typescript-eslint/visitor-keys"

import type * as Acorn from "acorn"
import type * as Walk from "acorn-walk"

import type { ParserOptions } from "@typescript-eslint/types"
import type { AST } from "@typescript-eslint/typescript-estree"
import type { TSESTree } from "@typescript-eslint/typescript-estree"

const ignoredNodes = Object.keys(visitorKeys).filter(key => key.startsWith("TS"))

// @ts-ignore
ignoredNodes.forEach(node => base[node] = () => {})

type Node = Acorn.Node | TSESTree.Node | AST<ParserOptions> | undefined

export function walk(node: Node, visitors: Walk.SimpleVisitors<unknown>) {
  return simple(node as any, visitors, base)
}

import { walk } from "../util/walk"

import type * as Acorn from "acorn"
import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions } from "@typescript-eslint/types"

export class ApplicationFileAnalyzer {
  static computeLocalApplicationConstant(ast: AST<ParserOptions> | undefined, importName: string): string | null {
    if (!ast) return null

    let localName: string | null = null

    walk(ast, {
      VariableDeclaration: (node: Acorn.VariableDeclaration) => {

        node.declarations.forEach(declarator => {
          if (declarator.id?.type !== "Identifier") return
          if (declarator.init?.type !== "CallExpression") return

          const call = declarator.init

          if (call.callee.type !== "MemberExpression") return
          if (call.callee.object.type !== "Identifier") return
          if (call.callee.property.type !== "Identifier") return

          if (call.callee.object.name !== importName) return
          if (call.callee.property.name !== "start") return

          localName = declarator.id.name
        })
      }
    })

    return localName
  }
}

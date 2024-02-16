import { describe, test, expect } from "vitest"
import * as builder from "../../src/util/ast_builder"

describe("util", () => {
  describe("ast_builder", () => {
    test("Program", () => {
      expect(builder.generate(builder.Program())).toEqual("")
    })

    test("ImportDeclaration", () => {
      expect(builder.generate(builder.ImportDeclaration([], builder.Literal("a")))).toEqual(`import "a";`)
      expect(builder.generate(builder.ImportDeclaration([builder.ImportSpecifier(builder.Identifier("A"))], builder.Literal("B")))).toEqual(`import {A} from "B";`)
      expect(builder.generate(builder.ImportDeclaration([builder.ImportSpecifier(builder.Identifier("A"), builder.Identifier("B"))], builder.Literal("C")))).toEqual(`import {A as B} from "C";`)
    })
  })
})

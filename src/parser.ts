import * as ESLintParser from "@typescript-eslint/typescript-estree"

import { Project } from "./project"

import type { ParserOptions } from "./types"

// TODO: Support decorator + reflect-metadata value definitions
// TODO: error or multiple classes

export class Parser {
  readonly project: Project

  private parser = ESLintParser
  private readonly parserOptions: ParserOptions = {
    loc: true,
    range: true,
    tokens: true,
    comment: true,
    sourceType: "module",
    ecmaVersion: "latest"
  }

  constructor(project: Project) {
    this.project = project
  }

  parse(code: string, filename?: string) {
    return this.parser.parse(code, {
      ...this.parserOptions,
      filePath: filename
    })
  }
}

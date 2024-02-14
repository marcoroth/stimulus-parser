import { SourceFile } from "./source_file"

import type * as Acorn from "acorn"

export class ImportDeclaration {
  public readonly sourceFile: SourceFile
  public readonly originalName?: string
  public readonly localName: string
  public readonly source: string
  public readonly isStimulusImport: boolean
  public readonly node: Acorn.ImportDeclaration

  constructor(sourceFile: SourceFile, args: { originalName?: string, localName: string, source: string, isStimulusImport: boolean, node: Acorn.ImportDeclaration}) {
    this.sourceFile = sourceFile
    this.originalName = args.originalName
    this.localName = args.localName
    this.source = args.source
    this.isStimulusImport = args.isStimulusImport
    this.node = args.node
  }

  get resolvedPath() {
    return this.source
  }
}

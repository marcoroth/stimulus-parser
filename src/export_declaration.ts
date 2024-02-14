import type * as Acorn from "acorn"

export class ExportDeclaration {
  public readonly exportedName?: string
  public readonly localName?: string
  public readonly source?: string
  public readonly isStimulusExport: boolean
  public readonly type: "default" | "named" | "namespace"
  public readonly node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration

  constructor(args: { exportedName?: string, localName?: string, source?: string, isStimulusExport: boolean, type: "default" | "named" | "namespace", node: Acorn.ExportNamedDeclaration | Acorn.ExportAllDeclaration | Acorn.ExportDefaultDeclaration}) {
    this.exportedName = args.exportedName
    this.localName = args.localName
    this.source = args.source
    this.isStimulusExport = args.isStimulusExport
    this.type = args.type
    this.node = args.node
  }
}

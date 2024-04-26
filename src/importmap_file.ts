import { loadPrism, Visitor, KeywordHashNode, TrueNode, FalseNode, CallNode, StringNode, AssocNode } from "@ruby/prism"

import type { Project } from "./project.js"
import type { SourceFile } from "./source_file.js"

type ImportmapConfigLanguage = "ruby" | "php"

class ImportmapConfigVisitor extends Visitor {
  private readonly importmapFile: ImportmapFile

  constructor(importmapFile: ImportmapFile) {
    super()
    this.importmapFile = importmapFile
  }

  visitCallNode(node: any) {
    if (node.name !== "pin" && node.name !== "pin_all_from") return

    const identifier = (node.arguments_?.arguments_[0])?.unescaped
    const kwargs = ((node.arguments_?.arguments_.find((arg: any) => arg instanceof KeywordHashNode))?.elements || [])

    const getKwarg = (kwargs: any, key: string): any | undefined => {
      return kwargs.find((kwarg: any) => kwarg.key?.unescaped === key)
    }

    const getStringValue = (kwarg: any): string | undefined => {
      return (kwarg?.value)?.unescaped
    }

    const underKwarg = getKwarg(kwargs, "under")
    const toKwarg = getKwarg(kwargs, "to")
    const preloadKwarg = getKwarg(kwargs, "preload")

    const under = getStringValue(underKwarg)
    const to = getStringValue(toKwarg)
    const preloadValue = preloadKwarg?.value

    if (node.name === "pin") {
      // pin doesn't preload by default
      const preload = preloadValue instanceof TrueNode

      this.importmapFile.pins.push(new Pin(identifier, to, preload, "app/javascript"))
    }

    if (node.name === "pin_all_from") {
      // pin_all_from preloads by default
      const preload = !(preloadValue instanceof FalseNode)

      this.importmapFile.pinAllFromPins.push(new PinAllFrom(identifier, under, to, preload, "app/javascript"))
    }

    super.visitCallNode(node);
  }
}

class Pin {
  public readonly identifier: string
  public readonly to?: string
  public readonly preload: boolean = false
  public readonly projectPath: string

  constructor(identifier: string, to?: string, preload: boolean = false, projectPath: string = "app/javascript") {
    this.identifier = identifier
    this.to = to
    this.preload = preload
    this.projectPath = projectPath
  }
}

class PinAllFrom {
  public readonly directory: string
  public readonly under?: string
  public readonly to?: string
  public readonly preload: boolean = true
  public readonly projectPath: string

  constructor(directory: string, under?: string, to?: string, preload: boolean = true, projectPath: string = "app/javascript") {
    this.directory = directory
    this.under = under
    this.to = to
    this.preload = preload
    this.projectPath = projectPath
  }
}

export class ImportmapFile {
  static rubyParser: any

  public readonly project: Project
  public readonly sourceFile: SourceFile
  public readonly language: ImportmapConfigLanguage
  public readonly pins: Pin[] = []
  public readonly pinAllFromPins: PinAllFrom[] = []
  public readonly importmapVisitor = new ImportmapConfigVisitor(this)

  constructor(project: Project, sourceFile: SourceFile, language: ImportmapConfigLanguage = "ruby") {
    this.project = project
    this.sourceFile = sourceFile
    this.language = language
  }

  get path() {
    return this.sourceFile.path
  }

  get content() {
    return this.sourceFile.content
  }

  async analyze() {
    if (this.language === "ruby") {
      if (!ImportmapFile.rubyParser) ImportmapFile.rubyParser = await loadPrism()

      const parseResult = ImportmapFile.rubyParser(this.sourceFile.content);

      parseResult.value.accept(this.importmapVisitor);
    }
  }
}

import { SourceFile } from "./source_file"

import { nodeModuleForPackageName } from "./util/npm"

import type { Project } from "./project"
import type { ControllerDefinition } from "./controller_definition"

interface NodeModuleArgs {
  name: string
  path: string
  entrypoint: string
  controllerRoots: string[]
  files: string[]
  type: "main" | "module" | "source"
}

export class NodeModule {
  public readonly project: Project
  public readonly name: string
  public readonly path: string
  public readonly entrypoint: string
  public readonly controllerRoots: string[]
  public readonly sourceFiles: SourceFile[] = []
  public readonly type: "main" | "module" | "source"

  static async forProject(project: Project, name: string) {
    return await nodeModuleForPackageName(project, name)
  }

  constructor(project: Project, args: NodeModuleArgs) {
    this.project = project
    this.name = args.name
    this.path = args.path
    this.entrypoint = args.entrypoint
    this.controllerRoots = args.controllerRoots
    this.type = args.type

    // TODO: files should be refreshable resp. the NodeModule class should know how to fetch its files
    this.sourceFiles = args.files.map(path => new SourceFile(this.project, path))
  }

  async initialize() {
    await Promise.allSettled(this.sourceFiles.map(sourceFile => sourceFile.initialize()))
  }

  async analyze() {
    const referencedFilePaths = this.sourceFiles.flatMap(s => s.importDeclarations.filter(i => i.isRelativeImport).map(i => i.resolvedRelativePath))
    const referencedSourceFiles = this.sourceFiles.filter(s => referencedFilePaths.includes(s.path))

    await Promise.allSettled(referencedSourceFiles.map(sourceFile => sourceFile.analyze()))
    await Promise.allSettled(this.sourceFiles.map(sourceFile => sourceFile.analyze()))
  }

  async refresh() {
    await Promise.allSettled(this.sourceFiles.map(sourceFile => sourceFile.refresh()))
  }

  get resolvedPath() {
    return this.entrypoint
  }

  get entrypointSourceFile(): SourceFile | undefined {
    return this.sourceFiles.find(file => file.path === this.entrypoint)
  }

  get resolvedSourceFile(): SourceFile | undefined {
    return this.entrypointSourceFile
  }

  get classDeclarations() {
    return this.sourceFiles.flatMap(file => file.classDeclarations)
  }

  get controllerDefinitions(): ControllerDefinition[] {
    return this.classDeclarations.map(klass => klass.controllerDefinition).filter(controller => controller) as ControllerDefinition[]
  }

  get files(): string[] {
    return this.sourceFiles.map(file => file.path)
  }

  get inspect(): object {
    return {
      name: this.name,
      type: this.type,
      controllerDefinitions: this.controllerDefinitions.map(c => c?.identifier),
      entrypoint: this.entrypoint,
      files: this.files.length
    }
  }
}

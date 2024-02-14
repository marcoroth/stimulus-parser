import { SourceFile } from "./source_file"

import { nodeModuleForPackageName } from "./util/npm"

import type { Project } from "./project"

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
    this.sourceFiles = args.files.map(path => new SourceFile(this.project, path))
  }

  async readFiles() {
    await Promise.allSettled(this.sourceFiles.map(sourceFile => sourceFile.read()))
  }

  async analyze() {
    await Promise.allSettled(this.sourceFiles.map(sourceFile => sourceFile.refresh()))
  }

  get resolvedPath() {
    return this.entrypoint
  }

  get entrypointSourceFile(): SourceFile | undefined {
    return this.sourceFiles.find(file => file.path === this.entrypoint)
  }

  get classDeclarations() {
    return this.sourceFiles.flatMap(file => file.classDeclarations)
  }

  get controllerDefinitions() {
    return this.classDeclarations.map(klass => klass.controllerDefinition).filter(controller => controller)
  }

  get files(): string[] {
    return this.sourceFiles.map(file => file.path)
  }
}

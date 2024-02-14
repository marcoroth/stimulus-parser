import type { Project } from "./project"
import type { SourceFile } from "./source_file"

interface NodeModuleArgs {
  entrypoint: string
  name: string
  path: string
  controllerRoots: string[]
  files: string[]
  type: "main" | "module" | "source"
}

export class NodeModule {
  public readonly project: Project
  public readonly entrypoint: string
  public readonly name: string
  public readonly path: string
  public readonly controllerRoots: string[]
  public readonly files: string[]
  public readonly type: "main" | "module" | "source"

  constructor(project: Project, args: NodeModuleArgs) {
    this.project = project
    this.entrypoint = args.entrypoint
    this.name = args.name
    this.path = args.path
    this.controllerRoots = args.controllerRoots
    this.files = args.files
    this.type = args.type
  }

  get resolvedPath() {
    return this.entrypoint
  }

  get entrypointSourceFile(): SourceFile | undefined {
    return this.project.sourceFiles.find(file => file.path === this.entrypoint)
  }

  // TODO: maybe convert the `files` property to SourceFile[] instead?
  get sourceFiles() {
    return this.files.map(file => this.project.sourceFiles.find(sourceFile => file === sourceFile.path))
  }
}

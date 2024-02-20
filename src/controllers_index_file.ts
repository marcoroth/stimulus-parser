import path from "path"

import { RegisteredController } from "./registered_controller"

import { glob } from "glob"
import { walk } from "./util/walk"
import { hasDepedency } from "./util/npm"

import type { Project } from "./project"
import type { SourceFile } from "./source_file"
import type { ImportDeclaration } from "./import_declaration"
import type { ControllerLoadMode } from "./types"

export class ControllersIndexFile {
  public readonly project: Project
  public readonly registeredControllers: RegisteredController[] = []
  public readonly sourceFile: SourceFile

  public readonly fallbackPath: string = "app/javascript/controllers/index.js"

  constructor(project: Project, sourceFile: SourceFile){
    this.project = project
    this.sourceFile = sourceFile
  }

  get path() {
    return this.sourceFile.path
  }

  get applicationImport(): ImportDeclaration | undefined {
    return this.sourceFile.importDeclarations.find(declaration =>
      declaration.originalName === this.project.applicationFile?.exportDeclaration?.exportedName
    )
  }

  async analyze() {
    this.analyzeApplicationRegisterCalls()
    this.analyzeApplicationLoadCalls()
    await this.analyzeStimulusLoadingCalls()
    await this.analyzeEsbuildRails()
  }

  analyzeApplicationRegisterCalls() {
    walk(this.sourceFile.ast, {
      CallExpression: node => {
        const { callee } = node

        if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.property.type === "Identifier") {
          const { object, property } = callee

          const objectName = object.name
          const propertyName = property.name

          if (objectName !== this.applicationImport?.localName) return

          if (propertyName !== "register") return

          const [identifierNode, controllerNode] = node.arguments.slice(0, 2)
          const identifier = (identifierNode.type === "Literal") ? identifierNode.value?.toString() : null
          const controllerName = (controllerNode.type === "Identifier") ? controllerNode.name : null

          if (!identifier || !controllerName) return // TODO: probably should add an error here

          const importDeclaration = this.sourceFile.findImport(controllerName)
          if (!importDeclaration) return // TODO: probably should add an error here

          const classDeclaration = importDeclaration.resolvedClassDeclaration
          if (!classDeclaration) return // TODO: probably should add an error here

          const controller = classDeclaration.controllerDefinition
          if (!controller) return // TODO: probably should add an error here

          this.registeredControllers.push(new RegisteredController(identifier, controller, "register"))
        }
      }
    })
  }

  analyzeApplicationLoadCalls() {
    walk(this.sourceFile.ast, {
      CallExpression: node => {
        const { callee } = node

        if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.property.type === "Identifier") {
          const { object, property } = callee

          const objectName = object.name
          const propertyName = property.name

          if (objectName !== this.applicationImport?.localName) return

          if (propertyName === "load") {
            // TODO
          }
        }
      }
    })
  }

  async analyzeStimulusLoadingCalls() {
    let controllersGlob
    let type: ControllerLoadMode = "stimulus-loading-eager"

    walk(this.sourceFile.ast, {
      CallExpression: node => {
        if (node.callee.type === "Identifier" && ["eagerLoadControllersFrom", "lazyLoadControllersFrom"].includes(node.callee.name)) {
          const [pathNode, applicationNode] = node.arguments.slice(0, 2)
          const controllersPath = (pathNode.type === "Literal") ? pathNode.value?.toString() : null
          const application = (applicationNode.type === "Identifier") ? applicationNode.name : null

          type = node.callee.name === "eagerLoadControllersFrom" ? "stimulus-loading-eager" : "stimulus-loading-lazy"

          if (!controllersPath || !application) return

          const base = this.project.relativePath(path.dirname(path.dirname(this.sourceFile.path)))
          const controllerRoot = path.join(this.project.projectPath, base, controllersPath)

          this.project._controllerRoots.push(this.project.relativePath(controllerRoot))

          controllersGlob = path.join(controllerRoot, `**/*.{${this.project.extensionsGlob}}`)
        }
      }
    })


    if (!controllersGlob) return

    await this.evaluateControllerGlob(controllersGlob, type)
  }


  async analyzeEsbuildRails() {
    const hasEsbuildRails = await hasDepedency(this.project.projectPath, "esbuild-rails")

    if (!hasEsbuildRails) return

    const imports = this.sourceFile.importDeclarations.find(declaration => declaration.source.includes("*"))

    if (!imports) return

    const controllersGlob = imports.resolvedRelativePath

    if (!controllersGlob) return

    this.project._controllerRoots.push(this.project.relativePath(this.sourceFile.path))

    await this.evaluateControllerGlob(controllersGlob, "esbuild-rails")
  }


  private async evaluateControllerGlob(controllersGlob: string, type: ControllerLoadMode) {
    const controllerFiles = (await glob(controllersGlob)).map(path => this.project.relativePath(path))
    const sourceFiles = this.project.projectFiles.filter(file => controllerFiles.includes(this.project.relativePath(file.path)))
    const controllerDefinitions = sourceFiles.flatMap(file => file.controllerDefinitions)

    controllerDefinitions.forEach(controller => {
      this.registeredControllers.push(new RegisteredController(controller.identifier, controller, type))
    })
  }
}

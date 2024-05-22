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
      declaration.originalName === this.project.applicationFile?.exportDeclaration?.exportedName && declaration.originalName !== undefined
    )
  }

  get localApplicationConstant() {
    return this.applicationImport?.localName || this.sourceFile.stimulusApplicationImport?.localName
  }

  async analyze() {
    this.analyzeApplicationRegisterCalls()
    this.analyzeApplicationLoadCalls()
    await this.analyzeStimulusLoadingCalls()
    await this.analyzeEsbuildRails()
    await this.analyzeStimulusViteHelpers()
    await this.analyzeStimulusWebpackHelpers()
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

          if (!identifier || !controllerName) return // TODO: probably should add an error here

          const importDeclaration = this.sourceFile.findImport(controllerName)
          if (!importDeclaration) return // TODO: probably should add an error here

          const classDeclaration = importDeclaration.resolvedClassDeclaration
          if (!classDeclaration) return // TODO: probably should add an error here

          const controller = classDeclaration.controllerDefinition
          if (!controller) return // TODO: probably should add an error here

          this.project._controllerRoots.add(this.project.relativePath(path.dirname(this.sourceFile.path)))

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
    let relativeControllerPath
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
          relativeControllerPath = this.project.relativePath(controllerRoot)

          this.project._controllerRoots.add(relativeControllerPath)

          controllersGlob = path.join(controllerRoot, `**/*.{${this.project.extensionsGlob}}`)
        }
      }
    })


    if (!controllersGlob || !relativeControllerPath) return

    await this.evaluateControllerGlob(relativeControllerPath, controllersGlob, type)
  }

  async analyzeEsbuildRails() {
    const hasEsbuildRails = await hasDepedency(this.project.projectPath, "esbuild-rails")

    if (!hasEsbuildRails) return

    const imports = this.sourceFile.importDeclarations.find(declaration => declaration.source.includes("*"))

    if (!imports) return

    const controllersGlob = imports.resolvedRelativePath

    if (!controllersGlob) return

    const controllerRoot = path.dirname(this.sourceFile.path)
    const relativeControllerRoot = this.project.relativePath(controllerRoot)

    this.project._controllerRoots.add(relativeControllerRoot)

    await this.evaluateControllerGlob(relativeControllerRoot, controllersGlob, "esbuild-rails")
  }

  async analyzeStimulusViteHelpers() {
    const hasViteHelpers = await hasDepedency(this.project.projectPath, "stimulus-vite-helpers")

    if (!hasViteHelpers) return

    let controllersGlob
    let relativeControllerRoot

    walk(this.sourceFile.ast, {
      CallExpression: node => {
        if (node.callee.type === "MemberExpression" && node.callee.object.type === "MetaProperty" && node.callee.property.type === "Identifier") {
          const [pathNode] = node.arguments.slice(0, 1)
          const importGlob = (pathNode.type === "Literal") ? pathNode.value?.toString() : null

          if (!importGlob) return

          const controllerRoot = path.dirname(this.sourceFile.path)
          relativeControllerRoot = this.project.relativePath(controllerRoot)
          this.project._controllerRoots.add(relativeControllerRoot)

          controllersGlob = path.join(controllerRoot, importGlob)
        }
      }
    })

    if (controllersGlob && relativeControllerRoot) {
      await this.evaluateControllerGlob(relativeControllerRoot, controllersGlob, "stimulus-vite-helpers")
    }
  }

  async analyzeStimulusWebpackHelpers() {
    const hasWebpackHelpers = await hasDepedency(this.project.projectPath, "@hotwired/stimulus-webpack-helpers")

    if (!hasWebpackHelpers) return

    let controllersGlob
    let relativeControllerRoot
    let definitionsFromContextCalled = false

    walk(this.sourceFile.ast, {
      CallExpression: node => {
        if (node.callee.type === "MemberExpression" && node.callee.object.type === "Identifier" && node.callee.property.type === "Identifier") {

          if (node.callee.object.name === "require" && node.callee.property.name === "context") {
            const [folder, _arg, pattern] = node.arguments.map(m => m.type === "Literal" ? m.value : undefined).filter(c => c).slice(0, 3)

            const controllerRoot = path.join(path.dirname(path.dirname(this.sourceFile.path)), folder?.toString() || "")
            relativeControllerRoot = this.project.relativePath(controllerRoot)
            this.project._controllerRoots.add(relativeControllerRoot)

            if (pattern instanceof RegExp) {
              controllersGlob = path.join(controllerRoot, `**/*${pattern.source.replace("$", "").replace("\\.", ".")}`)
            }
          }
        }
      }
    })

    walk(this.sourceFile.ast, {
      CallExpression: node => {
        if (node.callee.type === "Identifier" && ["definitionsFromContext"].includes(node.callee.name)) {
          const [contextNode] = node.arguments.slice(0, 1)
          const context = (contextNode.type === "Identifier") ? contextNode.name : null

          if (context) {
            definitionsFromContextCalled = true
          }
        }
      }
    })

    if (relativeControllerRoot && controllersGlob && definitionsFromContextCalled) {
      await this.evaluateControllerGlob(relativeControllerRoot, controllersGlob, "stimulus-webpack-helpers")
    }
  }

  private async evaluateControllerGlob(controllerRoot: string, controllersGlob: string, type: ControllerLoadMode) {
    const controllerFiles = (await glob(controllersGlob)).map(path => this.project.relativePath(path))
    const sourceFiles = this.project.projectFiles.filter(file => controllerFiles.includes(this.project.relativePath(file.path)))
    const controllerDefinitions = sourceFiles.flatMap(file => file.defaultExportControllerDefinition || [])

    controllerDefinitions.forEach(controller => {
      const registeredController = new RegisteredController(
        controller.identifierForControllerRoot(controllerRoot),
        controller,
        type
      )

      this.registeredControllers.push(registeredController)
    })
  }
}

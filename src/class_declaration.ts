import { simple } from "acorn-walk"

import type { TSESTree } from "@typescript-eslint/typescript-estree"

import * as ast from "./util/ast"
import * as decorators from "./util/decorators"
import * as properties from "./util/properties"

import { ParseError } from "./parse_error"
import { SourceFile } from "./source_file"
import { ControllerDefinition } from "./controller_definition"
import { ControllerPropertyDefinition, MethodDefinition } from "./controller_property_definition"

import type {
  ClassDeclarationNode,
  ExportDeclaration,
  ImportDeclaration,
} from "./types"

export class ClassDeclaration {
  public readonly sourceFile: SourceFile
  public readonly className?: string
  public readonly superClass?: ClassDeclaration
  public readonly node?: ClassDeclarationNode

  public isStimulusDescendant: boolean = false
  public importDeclaration?: ImportDeclaration;
  public exportDeclaration?: ExportDeclaration;
  public controllerDefinition?: ControllerDefinition

  constructor(className: string | undefined, superClass: ClassDeclaration | undefined, sourceFile: SourceFile, node?: ClassDeclarationNode | undefined) {
    this.className = className
    this.superClass = superClass
    this.sourceFile = sourceFile
    this.isStimulusDescendant = (superClass && superClass.isStimulusDescendant) || false
    this.node = node

    if (this.shouldParse) {
      this.controllerDefinition = new ControllerDefinition(this.sourceFile.project, this.sourceFile.path, this)
    }
  }

  get shouldParse() {
    return this.isStimulusDescendant
  }

  analyze() {
    if (!this.shouldParse) {
      console.info("didn't try to parse file at", this.sourceFile.path)

      return
    }

    this.analyzeClassDecorators()
    this.analyzeMethods()
    this.analyzeDecorators()
    this.analyzeStaticProperties()

    this.validate()
  }

  analyzeClassDecorators() {
    if (!this.node) return
    if (!this.controllerDefinition) return

    this.controllerDefinition.isTyped = !!decorators.extractDecorators(this.node).find(decorator =>
      (decorator.expression.type === "Identifier") ? decorator.expression.name === "TypedController" : false
    )
  }

  analyzeMethods() {
    if (!this.node) return

    simple(this.node, {
      MethodDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.kind !== "method") return
        if (node.key.type !== "Identifier" && node.key.type !== "PrivateIdentifier") return

        const tsNode = (node as unknown as TSESTree.MethodDefinition)
        const methodName = ast.extractIdentifier(node.key) as string
        const isPrivate = node.key.type === "PrivateIdentifier" || tsNode.accessibility === "private"
        const name = isPrivate ? `#${methodName}` : methodName

        this.controllerDefinition._methods.push(new MethodDefinition(name, node.loc, "static"))
      },

      PropertyDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.key.type !== "Identifier") return
        if (!node.value || node.value.type !== "ArrowFunctionExpression") return

        this.controllerDefinition._methods.push(new MethodDefinition(node.key.name, node.loc, "static"))
      },
    })
  }

  analyzeStaticProperties() {
    if (!this.node) return

    simple(this.node, {
      PropertyDefinition: node => {
        if (!node.value) return
        if (!node.static) return
        if (node.key.type !== "Identifier") return

        properties.parseStaticControllerProperties(this.controllerDefinition, node.key, node.value)
      }
    })
  }

  analyzeDecorators() {
    if (!this.node) return

    simple(this.node, {
      PropertyDefinition: (_node) => {
        const node = _node as unknown as TSESTree.PropertyDefinition

        decorators.extractDecorators(_node).forEach(decorator => {
          if (node.key.type !== "Identifier") return

          decorators.parseDecorator(this.controllerDefinition, node.key.name, decorator, node)
        })
      }
    })
  }

  public validate() {
    if (!this.controllerDefinition) return

    if (this.controllerDefinition.anyDecorator && !this.controllerDefinition.isTyped) {
      this.controllerDefinition.errors.push(
        new ParseError("LINT", "You need to decorate the controller with @TypedController to use decorators"),
      )
    }

    if (!this.controllerDefinition.anyDecorator && this.controllerDefinition.isTyped) {
      this.controllerDefinition.errors.push(
        new ParseError("LINT", "You decorated the controller with @TypedController to use decorators"),
      )
    }

    this.uniqueErrorGenerator(this.controllerDefinition, "target", this.controllerDefinition._targets)
    this.uniqueErrorGenerator(this.controllerDefinition, "class", this.controllerDefinition._classes)
    // values are reported at the time of parsing since we're storing them as an object
  }

  private uniqueErrorGenerator(controller: ControllerDefinition, type: string, items: ControllerPropertyDefinition[]) {
    const errors: string[] = []

    items.forEach((item, index) => {
      if (errors.includes(item.name)) return

      items.forEach((item2, index2) => {
        if (index2 === index) return

        if (item.name === item2.name) {
          errors.push(item.name)
          controller.errors.push(new ParseError("LINT", `Duplicate definition of ${type}:${item.name}`, item2.loc))
        }
      })
    })
  }
}

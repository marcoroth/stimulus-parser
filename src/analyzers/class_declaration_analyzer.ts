import * as ast from "../util/ast"
import * as decorators from "../util/decorators"
import * as properties from "../util/properties"
import { walk } from "../util/walk"

import { ParseError } from "../parse_error"
import { ControllerDefinition } from "../controller_definition"
import { MethodDefinition } from "../controller_property_definition"

import type { TSESTree } from "@typescript-eslint/typescript-estree"
import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions } from "@typescript-eslint/types"
import type { ClassDeclaration } from "../class_declaration"
import type { ClassDeclarationNode } from "../types"

export class ClassDeclarationAnalyzer {
  private readonly classDeclaration: ClassDeclaration
  private readonly sourceFileAst: AST<ParserOptions>

  constructor(classDeclaration: ClassDeclaration, sourceFileAst: AST<ParserOptions>) {
    this.classDeclaration = classDeclaration
    this.sourceFileAst = sourceFileAst
  }

  analyze() {
    if (!this.classDeclaration.isStimulusDescendant) return
    if (this.classDeclaration.isAnalyzed) return

    const classNode = this.findClassNode()
    if (!classNode) return

    this.classDeclaration.controllerDefinition = new ControllerDefinition(
      this.classDeclaration.sourceFile.project,
      this.classDeclaration
    )

    this.analyzeStaticPropertiesExpressions()
    this.analyzeClassDecorators(classNode)
    this.analyzeMethods(classNode)
    this.analyzeDecorators(classNode)
    this.analyzeStaticProperties(classNode)

    this.validate(classNode)

    this.classDeclaration.isAnalyzed = true
  }

  private findClassNode(): ClassDeclarationNode | undefined {
    let found: ClassDeclarationNode | undefined

    walk(this.sourceFileAst, {
      ClassDeclaration: node => {
        const name = ast.extractIdentifier(node.id)
        if (name === this.classDeclaration.className) found = node
      },
      ClassExpression: node => {
        const name = ast.extractIdentifier(node.id)
        if (name === this.classDeclaration.className) found = node
      },
      VariableDeclaration: node => {
        node.declarations.forEach(declaration => {
          if (declaration.type !== "VariableDeclarator") return
          if (declaration.id.type !== "Identifier") return
          if (!declaration.init || declaration.init.type !== "ClassExpression") return

          const name = ast.extractIdentifier(declaration.id)
          if (name === this.classDeclaration.className) found = declaration.init
        })
      }
    })

    return found
  }

  private analyzeStaticPropertiesExpressions() {
    const controllerDefinition = this.classDeclaration.controllerDefinition
    if (!controllerDefinition) return

    walk(this.sourceFileAst, {
      AssignmentExpression: (expression: any) => {
        if (expression.left.type !== "MemberExpression") return

        const object = expression.left.object
        const property = expression.left.property

        if (property.type !== "Identifier") return
        if (object.type !== "Identifier") return
        if (object.name !== controllerDefinition.classDeclaration.className) return

        properties.parseStaticControllerProperties(controllerDefinition, property, expression.right)
      },
    })
  }

  private analyzeClassDecorators(classNode: ClassDeclarationNode) {
    if (!this.classDeclaration.controllerDefinition) return

    this.classDeclaration.controllerDefinition.isTyped = !!decorators.extractDecorators(classNode).find(decorator =>
      (decorator.expression.type === "Identifier") ? decorator.expression.name === "TypedController" : false
    )
  }

  private analyzeMethods(classNode: ClassDeclarationNode) {
    walk(classNode, {
      MethodDefinition: node => {
        if (!this.classDeclaration.controllerDefinition) return
        if (node.kind !== "method") return
        if (node.key.type !== "Identifier" && node.key.type !== "PrivateIdentifier") return

        const tsNode = (node as unknown as TSESTree.MethodDefinition)
        const methodName = ast.extractIdentifier(node.key) as string
        const isPrivate = node.key.type === "PrivateIdentifier" || tsNode.accessibility === "private"
        const name = isPrivate ? `#${methodName}` : methodName

        this.classDeclaration.controllerDefinition.methodDefinitions.push(new MethodDefinition(name, node, node, node.loc, "static"))
      },

      PropertyDefinition: node => {
        if (!this.classDeclaration.controllerDefinition) return
        if (node.key.type !== "Identifier") return
        if (!node.value || node.value.type !== "ArrowFunctionExpression") return

        this.classDeclaration.controllerDefinition.methodDefinitions.push(new MethodDefinition(node.key.name, node, node, node.loc, "static"))
      },
    })
  }

  private analyzeStaticProperties(classNode: ClassDeclarationNode) {
    walk(classNode, {
      PropertyDefinition: node => {
        if (!node.value) return
        if (!node.static) return
        if (node.key.type !== "Identifier") return

        properties.parseStaticControllerProperties(this.classDeclaration.controllerDefinition, node.key, node.value)
      }
    })
  }

  private analyzeDecorators(classNode: ClassDeclarationNode) {
    walk(classNode, {
      PropertyDefinition: _node => {
        const node = _node as unknown as TSESTree.PropertyDefinition

        decorators.extractDecorators(_node).forEach(decorator => {
          if (node.key.type !== "Identifier") return

          decorators.parseDecorator(this.classDeclaration.controllerDefinition, node.key.name, decorator, node)
        })
      }
    })
  }

  private validate(classNode: ClassDeclarationNode) {
    if (!this.classDeclaration.controllerDefinition) return

    if (this.classDeclaration.controllerDefinition.anyDecorator && !this.classDeclaration.controllerDefinition.isTyped) {
      this.classDeclaration.controllerDefinition.errors.push(
        new ParseError("LINT", "Controller needs to be decorated with @TypedController in order to use decorators.", classNode.loc),
      )
    }

    if (!this.classDeclaration.controllerDefinition.anyDecorator && this.classDeclaration.controllerDefinition.isTyped) {
      this.classDeclaration.controllerDefinition.errors.push(
        new ParseError("LINT", "Controller was decorated with @TypedController but Controller didn't use any decorators.", classNode.loc),
      )
    }
  }
}

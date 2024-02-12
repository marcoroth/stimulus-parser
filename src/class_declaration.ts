import { simple } from "acorn-walk"

import type * as Acorn from "acorn"
import type { TSESTree } from "@typescript-eslint/typescript-estree"

import { SourceFile } from "./source_file"
import { ControllerDefinition } from "./controller_definition"
import { defaultValuesForType } from "./util"

import type {
  ClassDeclarationNode,
  ExportDeclaration,
  ImportDeclaration,
  NestedObject,
  PropertyValue,
  ValueDefinition,
  ValueDefinitionObject,
  ValueDefinitionValue
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

    if (this.shouldParse()) {
      this.controllerDefinition = new ControllerDefinition(this.sourceFile.project, this.sourceFile.path, this)
    }
  }

  shouldParse() {
    return this.isStimulusDescendant
  }

  analyze() {
    if (!this.shouldParse) {
      console.info("didn't try to parse file at", this.sourceFile.path)

      return
    }

    this.analyzeMethods()
    this.analyzeStaticProperties()
  }

  analyzeMethods() {
    if (!this.node) return

    simple(this.node, {
      MethodDefinition: (node: Acorn.MethodDefinition): void => {
        if (!this.controllerDefinition) return
        if (node.kind !== "method") return
        if (node.key.type !== "Identifier" && node.key.type !== "PrivateIdentifier") return

        const tsNode = (node as unknown as TSESTree.MethodDefinition)
        const methodName = this.sourceFile.extractIdentifier(node.key) as string
        const isPrivate = node.key.type === "PrivateIdentifier" || tsNode.accessibility === "private"
        const name = isPrivate ? `#${methodName}` : methodName

        this.controllerDefinition.methods.push(name)
      },

      PropertyDefinition: (node: Acorn.PropertyDefinition): void => {
        if (!this.controllerDefinition) return
        if (node.key.type !== "Identifier") return
        if (!node.value || node.value.type !== "ArrowFunctionExpression") return

        this.controllerDefinition.methods.push(node.key.name)
      },
    })
  }

  analyzeStaticProperties() {
    if (!this.node) return

    simple(this.node, {
      PropertyDefinition: (node: Acorn.PropertyDefinition): void => {
        if (!node.value) return
        if (node.key.type !== "Identifier") return

        this.parseStaticControllerProperties(node.key, node.value)
      }
    })
  }

  public parseStaticControllerProperties(left: Acorn.Identifier, right: Acorn.Expression) {
    if (!this.controllerDefinition) return

    if (right.type === "ArrayExpression") {
      if (left.name === "targets") this.controllerDefinition.targets = this.convertArrayExpression(right)
      if (left.name === "classes") this.controllerDefinition.classes = this.convertArrayExpression(right)
    }

    if (right.type === "ObjectExpression" && left.name === "values") {
      this.controllerDefinition.values = this.convertObjectExpressionToValueDefinition(right)
    }
  }

  convertArrayExpression(value: Acorn.ArrayExpression): Array<string> {
    return value.elements.map(node => {
      if (!node) return

      switch (node.type) {
        case "ArrayExpression": return this.convertArrayExpression(node)
        case "Literal":         return node.value?.toString()
        case "SpreadElement":   return // TODO: implement support for spreads
        default:                return
      }
    }).filter(value => value !== undefined) as string[]
  }

  convertObjectExpression(value: Acorn.ObjectExpression): NestedObject<PropertyValue> {
    const properties = value.properties.map(property => {
      if (property.type === "SpreadElement") return []
      if (property.key.type !== "Identifier") return []

      const value =
        property.value.type === "ObjectExpression"
          ? this.convertObjectExpression(property.value)
          : this.sourceFile.extractLiteral(property.value)

      return [property.key.name, value]
    }).filter(property => property !== undefined)

    return Object.fromEntries(properties)
  }

  // TODO: this method needs type cleanup
  convertObjectExpressionToValueDefinition(objectExpression: Acorn.ObjectExpression | undefined): ValueDefinitionObject {
    const object: ValueDefinitionObject = {}

    if (!objectExpression) return object

    objectExpression.properties.forEach(property => {
      if (!this.controllerDefinition) return
      if (property.type !== "Property") return

      const value = property.value

      let type
      let defaultValue

      if (value.type === "Identifier" && value.name && typeof value.name === "string") {
        type = value.name
        defaultValue = defaultValuesForType[type]
      } else if (value.type === "ObjectExpression") {
        const properties = (value.properties || []).filter(property => property.type === "Property") as Acorn.Property[]
        const typeProperty = properties.find((property: any) => property.key.name === "type") as Acorn.Property | undefined
        const defaultProperty = properties.find((property: any) => property.key.name === "default") as Acorn.Property | undefined

        type = typeProperty?.value

        if (type && type.type === "Identifier") {
          type = type.name || ""
          defaultValue = (defaultProperty?.value as Acorn.Literal)?.value

          if (!defaultValue && defaultProperty) {
            defaultValue = this.convertProperty(defaultProperty.value as any)
          }
        }
      }

      const valueDefiniton: ValueDefinition = {
        type: type as string,
        default: defaultValue as ValueDefinitionValue,
      }

      object[(property.key as Acorn.Identifier).name] = valueDefiniton
    })

    return object
  }

  convertProperty(value: Acorn.AnyNode) {
    switch (value.type) {
      case "ArrayExpression":
        return this.convertArrayExpression(value)
      case "ObjectExpression":
        return this.convertObjectExpression(value)
    }
  }
}

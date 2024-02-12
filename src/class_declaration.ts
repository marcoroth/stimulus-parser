import { simple } from "acorn-walk"

import type * as Acorn from "acorn"
import type { TSESTree } from "@typescript-eslint/typescript-estree"

import { ParseError } from "./parse_error"
import { SourceFile } from "./source_file"
import { ControllerDefinition } from "./controller_definition"
import { ControllerPropertyDefinition, MethodDefinition, TargetDefinition, ClassDefinition, ValueDefinition } from "./controller_property_definition"
import { defaultValuesForType } from "./util"

import type {
  ClassDeclarationNode,
  ExportDeclaration,
  ImportDeclaration,
  NestedObject,
  PropertyValue,
  ValueDefinition as ValueDefinitionType,
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

    this.controllerDefinition.isTyped = !!this.extractDecorators(this.node).find((decorator) =>
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
        const methodName = this.sourceFile.extractIdentifier(node.key) as string
        const isPrivate = node.key.type === "PrivateIdentifier" || tsNode.accessibility === "private"
        const name = isPrivate ? `#${methodName}` : methodName

        const loc = (node && node.loc) ? node.loc : undefined

        if (loc) this.controllerDefinition._methods.push(new MethodDefinition(name, loc, "static"))
      },

      PropertyDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.key.type !== "Identifier") return
        if (!node.value || node.value.type !== "ArrowFunctionExpression") return

        const loc = (node && node.loc) ? node.loc : undefined

        if (loc) this.controllerDefinition._methods.push(new MethodDefinition(node.key.name, loc, "static"))
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

        this.parseStaticControllerProperties(node.key, node.value)
      }
    })
  }

  analyzeDecorators() {
    if (!this.node) return

    simple(this.node, {
      PropertyDefinition: (_node) => {
        const node = _node as unknown as TSESTree.PropertyDefinition

        this.extractDecorators(_node).forEach(decorator => {
          if (node.key.type !== "Identifier") return
          if (!this.controllerDefinition) return

          this.parseDecorator(node.key.name, decorator, node)
        })
      },

    })
  }

  public parseStaticControllerProperties(left: Acorn.Identifier, right: Acorn.Expression) {
    if (!this.controllerDefinition) return

    if (right.type === "ArrayExpression") {
      if (left.name === "targets") {
        this.controllerDefinition._targets.push(
          ...this.convertArrayExpression(right).map(element => new TargetDefinition(element, right.loc, "static")),
        )
      }

      if (left.name === "classes") {
        this.controllerDefinition._classes.push(
          ...this.convertArrayExpression(right).map(element => new ClassDefinition(element, right.loc, "static")),
        )
      }
    }

    if (right.type === "ObjectExpression" && left.name === "values") {
      const definitions = this.convertObjectExpressionToValueDefinitions(right)

      definitions.forEach(definition => {
        if (!this.controllerDefinition) return

        const [name, valueDefinition] = definition

        if (this.controllerDefinition._values[name]) {
          this.controllerDefinition.errors.push(
            new ParseError("LINT", `Duplicate definition of value:${name}`, right.loc),
          )
        } else {
          this.controllerDefinition._values[name] = new ValueDefinition(name, valueDefinition, right.loc, "static")
        }
      })
    }
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

  public parseDecorator(name: string, decorator: TSESTree.Decorator, node: TSESTree.PropertyDefinition) {
    if (!this.controllerDefinition) return

    const decoratorName = (decorator.expression.type === "Identifier") ? decorator.expression.name :
    (decorator.expression.type === "CallExpression" && decorator.expression.callee.type === "Identifier") ? decorator.expression.callee.name : undefined

    switch (decoratorName) {
      case "Target":
      case "Targets":
        this.controllerDefinition.anyDecorator = true
        return this.controllerDefinition._targets.push(
          new TargetDefinition(this.stripDecoratorSuffix(name, "Target"), node.loc, "decorator"),
        )

      case "Class":
      case "Classes":
        this.controllerDefinition.anyDecorator = true
        return this.controllerDefinition._classes.push(
          new ClassDefinition(this.stripDecoratorSuffix(name, "Class"), node.loc, "decorator"),
        )

      case "Value":
        this.controllerDefinition.anyDecorator = true

        if (decorator.expression.type !== "CallExpression") return

        // @ts-ignore
        if (decorator.expression.name !== undefined || decorator.expression.arguments.length !== 1) {
          throw new Error("We dont support reflected types yet")
        }

        const key = this.stripDecoratorSuffix(name, "Value")
        const type = decorator.expression.arguments[0]

        if (this.controllerDefinition._values[key]) {
          this.controllerDefinition.errors.push(new ParseError("LINT", `Duplicate definition of value:${key}`, node.loc))
        }

        if (type.type !== "Identifier") return


        console.log(this.getDefaultValueFromNode(node.value as any))

        // console.log(node.value?.type)
        // console.log(this.getDefaultValueFromNode(node.value as any))

        // console.log(this.parseValuePropertyDefinition(node))
        // console.log(this.convertPropertyToValueDefinition(node.key as any))

        const defaultValue: ValueDefinitionValue = node.value ?
          this.getDefaultValueFromNode(node.value as unknown as Acorn.PropertyDefinition)
          : ValueDefinition.defaultValuesForType[type.name]

        const definition: ValueDefinitionType = {
          type: type.name,
          default: defaultValue
        }

        this.controllerDefinition._values[key] = new ValueDefinition(key, definition, node.loc, "decorator")
    }
  }

  private stripDecoratorSuffix(name: string, type: string) {
    return name.slice(0, name.indexOf(type))
  }

  // public parseProperty(controller: ControllerDefinition, node: TSESTree.PropertyDefinition) {
  //   const name = node?.key?.name || node?.left?.property?.name
  //   const elements = node?.value?.elements || node?.right?.elements
  //   const properties = node?.value?.properties || node?.right?.properties
  //
  //   switch (name) {
  //     case "targets":
  //       return controller._targets.push(
  //         ...elements.map((element: any) => new TargetDefinition(element.value, node.loc, "static")),
  //       )
  //     case "classes":
  //       return controller._classes.push(
  //         ...elements.map((element: any) => new ClassDefinition(element.value, node.loc, "static")),
  //       )
  //     case "values":
  //       properties.forEach((property: NodeElement) => {
  //         if (controller._values[property.key.name]) {
  //           controller.errors.push(
  //             new ParseError("LINT", `Duplicate definition of value:${property.key.name}`, node.loc),
  //           )
  //         }
  //
  //         controller._values[property.key.name] = new ValueDefinition(
  //           property.key.name,
  //           this.parseValuePropertyDefinition(property),
  //           node.loc,
  //           "static",
  //         )
  //       })
  //   }
  // }
  //

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

  convertObjectExpressionToValueDefinitions(objectExpression: Acorn.ObjectExpression): [string, ValueDefinitionType][] {
    const definitions: [string, ValueDefinitionType][] = []

    objectExpression.properties.map(property => {
      if (!this.controllerDefinition) return
      if (property.type !== "Property") return
      if (property.key.type !== "Identifier") return

      const definition = this.convertPropertyToValueDefinition(property)

      if (definition) {
        definitions.push([property.key.name, definition])
      }
    })

    return definitions
  }

  // TODO: extract
  private findPropertyInProperties(_properties: (Acorn.Property | Acorn.SpreadElement)[], propertyName: string): Acorn.Property | undefined {
    const properties = _properties.filter(property => property.type === "Property") as Acorn.Property[]

    return properties.find(property =>
      ((property.key.type === "Identifier") ? property.key.name : undefined) === propertyName
    )
  }

  // TODO: extract
  private convertObjectExpressionToValueDefinition(objectExpression: Acorn.ObjectExpression): ValueDefinitionType | undefined {
    const typeProperty = this.findPropertyInProperties(objectExpression.properties, "type")
    const defaultProperty = this.findPropertyInProperties(objectExpression.properties, "default")

    let type = undefined

    switch (typeProperty?.value?.type) {
      case "Identifier":
        type = typeProperty.value.name
        break;

      case "Literal":
        type = typeProperty.value?.toString()
        break
    }

    if (!type) return

    let defaultValue = this.getDefaultValueFromNode(defaultProperty?.value)

    return {
      type,
      default: defaultValue,
    }
  }

  convertPropertyToValueDefinition(property: Acorn.Property): ValueDefinitionType | undefined {
    if (!this.controllerDefinition) return

    switch (property.value.type) {
      case "Identifier":
        return {
          type: property.value.name,
          default: defaultValuesForType[property.value.name]
        }
      case "ObjectExpression":
        return this.convertObjectExpressionToValueDefinition(property.value)
    }
  }

  getDefaultValueFromNode(node: Acorn.AnyNode | null | undefined) {
    if (!node) return

    switch (node.type) {
      case "ArrayExpression":
        return this.convertArrayExpression(node)
      case "ObjectExpression":
        return this.convertObjectExpression(node)
      case "Literal":
        return node.value
      // case "Identifier":
      // return node.name
      default:
        throw new Error(`node type ${node?.type}`)
    }
  }

  extractDecorators(node: Acorn.AnyNode): TSESTree.Decorator[] {
    if ("decorators" in node && Array.isArray(node.decorators)) {
      return node.decorators
    } else {
      return []
    }
  }
}

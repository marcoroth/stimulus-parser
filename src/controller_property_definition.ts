import { findPropertyInProperties } from "./util/ast"

import type * as Acorn  from "acorn"

import type { ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "./types"
import type { TSESTree } from "@typescript-eslint/typescript-estree"

// TODO: ArrayExpression and ObjectExpression shoudl probably be PropertyDefinition as well
// AssignmentExpression | PropertyDefinition
//
// maybe the ControllerPropertyDefinition superclass should be Acorn.Node, but the subclasses themselves can narrow down the type
type Node = Acorn.MethodDefinition | Acorn.PropertyDefinition | Acorn.ArrayExpression | Acorn.ObjectExpression
type ElementNode = Acorn.Property | Acorn.PropertyDefinition | Acorn.ArrayExpression | Acorn.Literal | Acorn.Identifier | Acorn.MethodDefinition

export abstract class ControllerPropertyDefinition {
  constructor(
    public readonly name: string,
    public readonly node: Node,
    public readonly elementNode: ElementNode,
    public readonly loc?: Acorn.SourceLocation | null,
    public readonly definitionType: "decorator" | "static" = "static",
  ) {}
}

export class ValueDefinition extends ControllerPropertyDefinition {
  constructor(
    name: string,
    public readonly definition: ValueDefinitionType,
    node: Node,
    private propertyNode: Acorn.Property,
    loc?: Acorn.SourceLocation | null,
    definitionType: "decorator" | "static" = "static",
  ) {
    super(name, node, propertyNode, loc, definitionType)
  }

  get type() {
    return this.definition.type
  }

  get elementNodePropertyValue() {
    const propertyValue = this.propertyNode?.value

    if (!propertyValue) return
    if (propertyValue.type !== "ObjectExpression") return

    return propertyValue
  }

  get keyLoc() {
    if (this.definitionType === "decorator") {
      return (this.node as Acorn.PropertyDefinition).key?.loc || this.node.loc
    }

    return this.propertyNode.key?.loc || this.node.loc
  }

  get typeLoc() {
    switch(this.definition.kind) {
      case "shorthand":
        return this.propertyNode.value?.loc || this.node.loc

      case "expanded":
        return findPropertyInProperties(this.elementNodePropertyValue?.properties || [], "type")?.value?.loc || this.node.loc

      case "decorator":
        const decorators = (this.node as any as TSESTree.PropertyDefinition).decorators || []
        return decorators[0]?.loc || this.node.loc

      default:
        return this.node.loc
    }
  }

  get defaultValueLoc(): Acorn.SourceLocation | null | undefined {
    switch(this.definition.kind) {
      case "shorthand": return undefined

      case "expanded":
        return findPropertyInProperties(this.elementNodePropertyValue?.properties || [], "default")?.value?.loc

      case "decorator":
        return (this.node as Acorn.PropertyDefinition).value?.loc

      default:
        return undefined
    }
  }

  get hasExplicitDefaultValue(): boolean {
    return !!this.defaultValueLoc
  }

  get valueLoc() {
    if (this.definitionType === "decorator") {
      return (this.node as Acorn.PropertyDefinition).value?.loc || this.node.loc
    }

    return this.propertyNode.value?.loc || this.node.loc
  }

  get default() {
    return this.definition.default
  }

  public static defaultValuesForType = {
    Array: [],
    Boolean: false,
    Number: 0,
    Object: {},
    String: "",
  } as { [key: string]: ValueDefinitionValue }
}

export class MethodDefinition extends ControllerPropertyDefinition {}
export class ClassDefinition extends ControllerPropertyDefinition {}
export class TargetDefinition extends ControllerPropertyDefinition {}

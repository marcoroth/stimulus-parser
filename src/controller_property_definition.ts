import { findPropertyInProperties } from "./util/ast"

import type * as Acorn  from "acorn"

import type { ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "./types"
import type { TSESTree } from "@typescript-eslint/typescript-estree"

// TODO: ArrayExpression and ObjectExpression shoudl probably be PropertyDefinition as well
// AssignmentExpression | PropertyDefinition
//
// maybe the ControllerPropertyDefinition superclass should be Acorn.Node, but the subclasses themselves can narrow down the type
type Node = Acorn.MethodDefinition | Acorn.PropertyDefinition | Acorn.ArrayExpression | Acorn.ObjectExpression

export abstract class ControllerPropertyDefinition {
  constructor(
    public readonly name: string,
    public readonly node: Node,
    public readonly loc?: Acorn.SourceLocation | null,
    public readonly definitionType: "decorator" | "static" = "static",
  ) {}
}

export class ValueDefinition extends ControllerPropertyDefinition {
  constructor(
    name: string,
    public readonly definition: ValueDefinitionType,
    node: Node,
    loc?: Acorn.SourceLocation | null,
    definitionType: "decorator" | "static" = "static",
  ) {
    super(name, node, loc, definitionType)
  }

  get type() {
    return this.definition.type
  }

  get propertyValues() {
    if (this.definitionType === "decorator") return

    const node = this.node as Acorn.ObjectExpression
    return findPropertyInProperties(node.properties, this.name)
  }

  get keyLoc() {
    if (this.definitionType === "decorator") {
      return (this.node as Acorn.PropertyDefinition).key?.loc || this.node.loc
    }

    return this.propertyValues?.key.loc || this.node.loc
  }

  get typeLoc() {
    switch(this.definition.kind) {
      case "shorthand":
        return this.propertyValues?.value.loc || this.node.loc

      case "expanded":
        const propValues = this.propertyValues?.value as Acorn.ObjectExpression
        return findPropertyInProperties(propValues.properties, "type")?.value?.loc || this.node.loc

      case "decorator":
        const decorators = (this.node as any as TSESTree.PropertyDefinition).decorators || []
        return decorators[0]?.loc || this.node.loc

      default:
        return this.node.loc
    }
  }

  get valueLoc() {
    if (this.definitionType === "decorator") {
      return (this.node as Acorn.PropertyDefinition).value?.loc || this.node.loc
    }

    return this.propertyValues?.value.loc || this.node.loc
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

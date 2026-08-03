import { findPropertyInProperties } from "./util/ast"

import type * as Acorn  from "acorn"

import type { ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "./types"
import type { TSESTree } from "@typescript-eslint/typescript-estree"

// TODO: ArrayExpression and ObjectExpression shoudl probably be PropertyDefinition as well
// AssignmentExpression | PropertyDefinition
//
// maybe the ControllerPropertyDefinition superclass should be Acorn.Node, but the subclasses themselves can narrow down the type
type Node = Acorn.MethodDefinition | Acorn.PropertyDefinition | Acorn.ArrayExpression | Acorn.ObjectExpression
type ElementNode = Acorn.Property | Acorn.PropertyDefinition | Acorn.ArrayExpression | Acorn.Literal | Acorn.Identifier | Acorn.MethodDefinition

export type { Node as ControllerPropertyNode, ElementNode as ControllerPropertyElementNode }

export abstract class ControllerPropertyDefinition {
  public readonly name: string
  public readonly loc?: Acorn.SourceLocation | null
  public readonly definitionType: "decorator" | "static" = "static"

  constructor(
    name: string,
    node: Node,
    elementNode: ElementNode,
    loc?: Acorn.SourceLocation | null,
    definitionType: "decorator" | "static" = "static",
  ) {
    this.name = name
    this.loc = loc
    this.definitionType = definitionType
  }
}

export class ValueDefinition extends ControllerPropertyDefinition {
  public readonly definition: ValueDefinitionType

  private readonly _keyLoc: Acorn.SourceLocation | null | undefined
  private readonly _typeLoc: Acorn.SourceLocation | null | undefined
  private readonly _defaultValueLoc: Acorn.SourceLocation | null | undefined
  private readonly _valueLoc: Acorn.SourceLocation | null | undefined

  constructor(
    name: string,
    definition: ValueDefinitionType,
    node: Node,
    propertyNode: Acorn.Property,
    loc?: Acorn.SourceLocation | null,
    definitionType: "decorator" | "static" = "static",
  ) {
    super(name, node, propertyNode, loc, definitionType)
    this.definition = definition

    const elementNodePropertyValue = (propertyNode?.value?.type === "ObjectExpression") ? propertyNode.value : undefined

    // keyLoc
    if (definitionType === "decorator") {
      this._keyLoc = (node as Acorn.PropertyDefinition).key?.loc || node.loc
    } else {
      this._keyLoc = propertyNode.key?.loc || node.loc
    }

    // typeLoc
    switch (definition.kind) {
      case "shorthand":
        this._typeLoc = propertyNode.value?.loc || node.loc
        break
      case "expanded":
        this._typeLoc = findPropertyInProperties(elementNodePropertyValue?.properties || [], "type")?.value?.loc || node.loc
        break
      case "decorator":
        const decorators = (node as any as TSESTree.PropertyDefinition).decorators || []
        this._typeLoc = decorators[0]?.loc || node.loc
        break
      default:
        this._typeLoc = node.loc
    }

    // defaultValueLoc
    switch (definition.kind) {
      case "shorthand":
        this._defaultValueLoc = undefined
        break
      case "expanded":
        this._defaultValueLoc = findPropertyInProperties(elementNodePropertyValue?.properties || [], "default")?.value?.loc
        break
      case "decorator":
        this._defaultValueLoc = (node as Acorn.PropertyDefinition).value?.loc
        break
      default:
        this._defaultValueLoc = undefined
    }

    // valueLoc
    if (definitionType === "decorator") {
      this._valueLoc = (node as Acorn.PropertyDefinition).value?.loc || node.loc
    } else {
      this._valueLoc = propertyNode.value?.loc || node.loc
    }
  }

  get type() {
    return this.definition.type
  }

  get keyLoc() {
    return this._keyLoc
  }

  get typeLoc() {
    return this._typeLoc
  }

  get defaultValueLoc(): Acorn.SourceLocation | null | undefined {
    return this._defaultValueLoc
  }

  get hasExplicitDefaultValue(): boolean {
    return !!this._defaultValueLoc
  }

  get valueLoc() {
    return this._valueLoc
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

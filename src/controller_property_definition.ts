import type * as Acorn  from "acorn"

import type { ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "./types"
import { findPropertyInProperties } from "./util/ast"

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
    if(this.definitionType === "decorator") {
      return
    }
    const node = this.node as Acorn.ObjectExpression
    return findPropertyInProperties(node.properties, this.name, this.node.type)
  }

  get keyLoc() {
    return this.propertyValues?.key.loc
  }

  get typeLoc() {
    if(!this.propertyValues) {
      return 
    }
    switch(this.definition.kind) {
      case "shorthand": 
        return this.propertyValues.value.loc
      case "expanded": 
        const propValues = this.propertyValues.value as Acorn.ObjectExpression
        const valueLocation = findPropertyInProperties(propValues.properties, "type")?.value?.loc
        return valueLocation
        default: 
          return
    }
  }

  get valueLoc() {
    return this.propertyValues?.value.loc
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

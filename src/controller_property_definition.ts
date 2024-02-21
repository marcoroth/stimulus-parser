import type { SourceLocation, Node } from "acorn"

import type { ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "./types"

export abstract class ControllerPropertyDefinition {
  constructor(
    public readonly name: string,
    public readonly node: Node,
    public readonly loc?: SourceLocation | null,
    public readonly definitionType: "decorator" | "static" = "static",
  ) {}
}

export class ValueDefinition extends ControllerPropertyDefinition {
  constructor(
    name: string,
    public readonly definition: ValueDefinitionType,
    node: Node,
    loc?: SourceLocation | null,
    definitionType: "decorator" | "static" = "static",
  ) {
    super(name, node, loc, definitionType)
  }

  get type() {
    return this.definition.type
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

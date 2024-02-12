import { SourceLocation } from "acorn"

import type { ValueDefinitionValue, ValueDefinition as ValueDefinitionType } from "./types"

export abstract class ControllerPropertyDefinition {
  constructor(
    public readonly name: string,
    public readonly loc?: SourceLocation | null,
    public readonly definitionType: "decorator" | "static" = "decorator",
  ) {}
}

export class ValueDefinition extends ControllerPropertyDefinition {
  constructor(
    name: string,
    public readonly definition: ValueDefinitionType,
    loc?: SourceLocation | null,
    definitionType: "decorator" | "static" = "decorator",
  ) {
    super(name, loc, definitionType)
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

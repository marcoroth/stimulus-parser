import { SourceLocation } from "acorn"

type ValueDefinitionValue = Array<any> | boolean | number | object | string | undefined

export abstract class ControllerPropertyDefinition {
  constructor(
    public readonly name: string,
    public readonly loc?: SourceLocation,
    public readonly definitionType: "decorator" | "static" = "decorator",
  ) {}
}

export class ValueDefinition extends ControllerPropertyDefinition {
  constructor(
    name: string,
    public readonly valueDef: { type: string; default: ValueDefinitionValue },
    loc?: SourceLocation,
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

import * as Acorn from "acorn"

const node: Acorn.Node = {
  type: "Node",
  start: 0,
  end: 0,
  range: [0, 0],
  loc: {
    start: {
      line: 0,
      column: 0
    },
    end: {
      line: 0,
      column: 0
    }
  }
}

export * from "./stimulus_builder"
export { generate } from "astring"

export function Program(body: (Acorn.Statement|Acorn.ModuleDeclaration)[] = []): Acorn.Program {
  return {
    ...node,
    type: "Program",
    sourceType: "module",
    body,
  }
}

export function ClassBody(body: (Acorn.MethodDefinition | Acorn.PropertyDefinition | Acorn.StaticBlock)[] = []): Acorn.ClassBody {
  return {
    ...node,
    type: "ClassBody",
    body
  }
}

export function ClassDeclaration(id: Acorn.Identifier | null, superClass?: Acorn.Identifier, body?: (Acorn.MethodDefinition | Acorn.PropertyDefinition | Acorn.StaticBlock)[]): Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration {
  return {
    ...node,
    type: "ClassDeclaration",
    body: ClassBody(body),
    superClass,
    id,
  }
}

export function ImportSpecifier(imported: Acorn.Identifier, local?: Acorn.Identifier): Acorn.ImportSpecifier {
  return {
    ...node,
    type: "ImportSpecifier",
    local: local || imported,
    imported,
  }
}

export function ImportDeclaration(specifiers: Acorn.ImportSpecifier[], source: Acorn.Literal): Acorn.ImportDeclaration {
  return {
    ...node,
    type: "ImportDeclaration",
    source,
    specifiers,
  }
}

export function ExportDefaultDeclaration(declaration: Acorn.ClassDeclaration | Acorn.AnonymousClassDeclaration): Acorn.ExportDefaultDeclaration {
  return {
    ...node,
    type: "ExportDefaultDeclaration",
    declaration,
  }
}

export function Literal(value: string): Acorn.Literal {
  return {
    ...node,
    type: "Literal",
    raw: `"${value}"`,
    value,
  }
}

export function Identifier(name: string): Acorn.Identifier {
  return {
    ...node,
    type: "Identifier",
    name,
  }
}

export function ArrayExpression(elements: Acorn.Literal[]): Acorn.ArrayExpression {
  return {
    ...node,
    type: "ArrayExpression",
    elements
  }
}

export function Property(key: Acorn.Expression, value: Acorn.Expression): Acorn.Property {
  return {
    ...node,
    type: "Property",
    kind: "init",
    method: false,
    shorthand: false,
    computed: false,
    key,
    value,
  }
}

export function ObjectExpression(properties: Acorn.Property[]): Acorn.ObjectExpression {
  return {
    ...node,
    type: "ObjectExpression",
    properties,
  }
}

export function PropertyDefinition(key: Acorn.Expression, value: Acorn.Expression, staticValue: boolean = true): Acorn.PropertyDefinition {
  return {
    ...node,
    type: "PropertyDefinition",
    computed: false,
    static: staticValue,
    key,
    value,
  }
}

export function MethodDefinition(key: Acorn.Expression, value: Acorn.FunctionExpression): Acorn.MethodDefinition {
  return {
    ...node,
    type: "MethodDefinition",
    computed: false,
    kind: "method",
    static: false,
    key,
    value,
  }
}

export function MemberExpression(object: Acorn.Identifier, property: Acorn.Identifier): Acorn.MemberExpression {
  return {
    ...node,
    type: "MemberExpression",
    computed: false,
    optional: false,
    object,
    property,
  }
}

export function CallExpression(callee: Acorn.MemberExpression, args: (Acorn.Expression | Acorn.SpreadElement)[] = []): Acorn.CallExpression {
  return  {
    ...node,
    type: "CallExpression",
    optional: false,
    arguments: args,
    callee
  }
}

export function ExpressionStatement(expression: Acorn.Expression): Acorn.ExpressionStatement {
  return {
    ...node,
    type: "ExpressionStatement",
    expression
  }
}

export function BlockStatement(body: Acorn.Statement[]): Acorn.BlockStatement {
  return {
    ...node,
    type: "BlockStatement",
    body,
  }
}

export function FunctionExpression(params: Acorn.Pattern[] = [], body: Acorn.BlockStatement): Acorn.FunctionExpression {
  return {
    ...node,
    type: "FunctionExpression",
    async: false,
    generator: false,
    expression: false,
    params,
    body
  }
}

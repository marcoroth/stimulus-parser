import { ValueDefinition, ClassDefinition, TargetDefinition } from "../controller_property_definition"
import { ControllerDefinition } from "../controller_definition"

import type * as Acorn from "acorn"
import * as ast from "./ast"

export function parseStaticControllerProperties(controllerDefinition: ControllerDefinition | undefined, left: Acorn.Identifier, right: Acorn.Expression): void {
  if (!controllerDefinition) return

  if (right.type === "ArrayExpression") {
    if (left.name === "targets") {
      ast.convertArrayExpressionToStringsAndNodes(right).map(([element, elementNode]) =>
        controllerDefinition.addTargetDefinition(
          new TargetDefinition(element, right, elementNode, right.loc, "static")
        )
      )
    }

    if (left.name === "classes") {
      ast.convertArrayExpressionToStringsAndNodes(right).map(([element, elementNode]) =>
        controllerDefinition.addClassDefinition(
          new ClassDefinition(element, right, elementNode, right.loc, "static")
        )
      )
    }
  }

  if (right.type === "ObjectExpression" && left.name === "values") {
    const definitions = ast.convertObjectExpressionToValueDefinitions(right)

    definitions.forEach(([name, valueDefinition, propertyNode]) => {
      controllerDefinition.addValueDefinition(
        new ValueDefinition(name, valueDefinition, right, propertyNode, right.loc, "static")
      )
    })
  }
}

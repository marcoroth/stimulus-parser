import { ValueDefinition, ClassDefinition, TargetDefinition } from "../controller_property_definition"
import { ControllerDefinition } from "../controller_definition"

import type * as Acorn from "acorn"
import * as ast from "./ast"

export function parseStaticControllerProperties(controllerDefinition: ControllerDefinition | undefined, left: Acorn.Identifier, right: Acorn.Expression): void {
  if (!controllerDefinition) return

  if (right.type === "ArrayExpression") {
    if (left.name === "targets") {
      ast.convertArrayExpression(right).map(element =>
        controllerDefinition.addTargetDefinition(
          new TargetDefinition(element, right, right.loc, "static")
        )
      )
    }

    if (left.name === "classes") {
      ast.convertArrayExpression(right).map(element =>
        controllerDefinition.addClassDefinition(
          new ClassDefinition(element, right, right.loc, "static")
        )
      )
    }
  }

  if (right.type === "ObjectExpression" && left.name === "values") {
    const definitions = ast.convertObjectExpressionToValueDefinitions(right)

    definitions.forEach(([name, valueDefinition]) => {
      controllerDefinition.addValueDefinition(
        new ValueDefinition(name, valueDefinition, right, right.loc, "static")
      )
    })
  }
}

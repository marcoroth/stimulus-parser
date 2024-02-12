import { ValueDefinition, ClassDefinition, TargetDefinition } from "../controller_property_definition"
import { ControllerDefinition } from "../controller_definition"
import { ParseError } from "../parse_error"

import type * as Acorn from "acorn"
import * as ast from "./ast"

export function parseStaticControllerProperties(controllerDefinition: ControllerDefinition | undefined, left: Acorn.Identifier, right: Acorn.Expression): void {
  if (!controllerDefinition) return

  if (right.type === "ArrayExpression") {
    if (left.name === "targets") {
      controllerDefinition._targets.push(
        ...ast.convertArrayExpression(right).map(element => new TargetDefinition(element, right.loc, "static")),
      )
    }

    if (left.name === "classes") {
      controllerDefinition._classes.push(
        ...ast.convertArrayExpression(right).map(element => new ClassDefinition(element, right.loc, "static")),
      )
    }
  }

  if (right.type === "ObjectExpression" && left.name === "values") {
    const definitions = ast.convertObjectExpressionToValueDefinitions(right)

    definitions.forEach(definition => {
      const [name, valueDefinition] = definition

      if (controllerDefinition._values[name]) {
        const error = new ParseError("LINT", `Duplicate definition of value:${name}`, right.loc)

        controllerDefinition.errors.push(error)
      } else {
        controllerDefinition._values[name] = new ValueDefinition(name, valueDefinition, right.loc, "static")
      }
    })
  }
}

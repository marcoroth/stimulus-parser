import * as Acorn from "acorn"

export const nodelessCompare = (objects: (object & { node: Acorn.Node })[]): object => {
  objects.forEach(object => delete object.node)

  return objects
}

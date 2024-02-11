import type { ImportDeclaration, ExportDeclaration, ClassDeclaration } from "../../src/types"

export const stripNodeField = (object: any): any => {
  if (object?.node) {
    delete object.node
  }
}

export const stripSuperClassField = (object: any): any => {
  if (object?.superClass) {
    object.superClass = { className: object.superClass?.className }
  }
}

export const nodelessCompare = (objects: (ImportDeclaration | ExportDeclaration)[]): (ImportDeclaration | ExportDeclaration)[] => {
  objects.forEach(stripNodeField)

  return objects
}

export const stripSuperClasses = (objects: ClassDeclaration[]): ClassDeclaration[] => {
  objects.forEach(object => {
    stripNodeField(object)
    stripNodeField(object.importDeclaration)

    if (object.superClass) {
      stripSuperClasses([object.superClass])
    }
  })

  return objects
}

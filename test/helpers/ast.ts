import { ClassDeclaration } from "../../src/class_declaration"
import type { ImportDeclaration, ExportDeclaration } from "../../src/types"

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
  return objects.map(object => {
    stripNodeField(object)
    stripNodeField(object.importDeclaration)
    stripNodeField(object.exportDeclaration)

    // @ts-ignore
    delete object.sourceFile
    delete object?.controllerDefinition

    if (object.superClass) {
      stripSuperClasses([object.superClass])
    }

    return object
  })
}

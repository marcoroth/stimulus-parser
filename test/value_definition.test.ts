import { describe, expect, test } from "vitest"
import { ValueDefinition } from "../src/controller_property_definition"

describe("ValueDefinition", () => {
  describe("defaultValuesForType", () => {
    test("Array", () => {
      expect(ValueDefinition.defaultValuesForType.Array).toEqual([])
    })

    test("Object", () => {
      expect(ValueDefinition.defaultValuesForType.Object).toEqual({})
    })

    test("Number", () => {
      expect(ValueDefinition.defaultValuesForType.Number).toEqual(0)
    })

    test("String", () => {
      expect(ValueDefinition.defaultValuesForType.String).toEqual("")
    })

    test("Boolean", () => {
      expect(ValueDefinition.defaultValuesForType.Boolean).toEqual(false)
    })
  })
})

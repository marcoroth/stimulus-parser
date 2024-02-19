import dedent from "dedent"
import { describe, test, expect } from "vitest"

import * as builder from "../../src/util/ast_builder"

describe("util", () => {
  describe("stimulus_builder", () => {
    test("StimulusImport", () => {
      expect(builder.generate(builder.StimulusImport())).toEqual(`import {Controller} from "@hotwired/stimulus";`)
    })

    test("StimulusClassDeclaration", () => {
      expect(builder.generate(builder.StimulusClassDeclaration())).toEqual(`class extends Controller {}`)
      expect(builder.generate(builder.StimulusClassDeclaration("HelloController"))).toEqual(`class HelloController extends Controller {}`)
      expect(builder.generate(builder.StimulusClassDeclaration("HelloController", "ApplicationController"))).toEqual(`class HelloController extends ApplicationController {}`)
    })

    test("EmptyMethodDefinition", () => {
      expect(builder.generate(builder.EmptyMethodDefinition("connect"))).toEqual(dedent`
        connect(event) {
          console.log("connect", event);
        }
      `)
    })

    test("TargetsProperty", () => {
      expect(builder.generate(builder.TargetsProperty())).toEqual(dedent`
        static targets = [];
      `)

      expect(builder.generate(builder.TargetsProperty("one"))).toEqual(dedent`
        static targets = ["one"];
      `)

      expect(builder.generate(builder.TargetsProperty("one", "two"))).toEqual(dedent`
        static targets = ["one", "two"];
      `)
    })

    test("ClassesProperty", () => {
      expect(builder.generate(builder.ClassesProperty())).toEqual(dedent`
        static classes = [];
      `)

      expect(builder.generate(builder.ClassesProperty("one"))).toEqual(dedent`
        static classes = ["one"];
      `)

      expect(builder.generate(builder.ClassesProperty("one", "two"))).toEqual(dedent`
        static classes = ["one", "two"];
      `)
    })

    test("ValuesProperty", () => {
      expect(builder.generate(builder.ValuesProperty())).toEqual(dedent`
        static values = {};
      `)

      expect(builder.generate(builder.ValuesProperty(["open", "Boolean"]))).toEqual(dedent`
        static values = {
          open: Boolean
        };
      `)

      expect(builder.generate(builder.ValuesProperty(["url", "String", "/path"]))).toEqual(dedent`
        static values = {
          url: {
            type: String,
            default: "/path"
          }
        };
      `)
    })

    test("generates full controller file", () => {
      const program = builder.Program()
      const controller = builder.StimulusClassDeclaration()

      program.body = [
        builder.StimulusImport(),
        builder.ExportDefaultDeclaration(controller)
      ]

      controller.body.body = [
        builder.TargetsProperty("input", "output"),
        builder.ClassesProperty("loading", "loaded"),

        builder.ValuesProperty(
          ["open", "Boolean"],
          ["url", "String", "/path"]
        ),

        builder.EmptyMethodDefinition("connect"),
        builder.EmptyMethodDefinition("disconnect"),
      ]

      expect(builder.generate(program)).toContain(dedent`
        import {Controller} from "@hotwired/stimulus";
        export default class extends Controller {
          static targets = ["input", "output"];
          static classes = ["loading", "loaded"];
          static values = {
            open: Boolean,
            url: {
              type: String,
              default: "/path"
            }
          };
          connect(event) {
            console.log("connect", event);
          }
          disconnect(event) {
            console.log("disconnect", event);
          }
        }
      `)
    })
  })
})

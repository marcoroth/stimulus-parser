import dedent from "dedent"
import { describe, beforeEach, test, expect } from "vitest"

import { SourceFile } from "../../src"
import { setupProject } from "../helpers/setup"

let project = setupProject("app")

const parentCode = dedent`
  import { Controller } from "@hotwired/stimulus"

  export default class extends Controller {
    static targets = ["parentTarget1", "parentTarget2"]
    static classes = ["parentClass1", "parentClass2"]
    static values = {
      parentValue1: Boolean,
      parentValue2: {
        type: String,
        default: "parent2"
      }
    }

    parentAction1() {}
    parentAction2() {}
  }
`

const childCode = dedent`
  import ParentController from "./parent_controller"

  export default class extends ParentController {
    static targets = ["childTarget1", "childTarget2"]
    static classes = ["childClass1", "childClass2"]
    static values = {
      childValue1: Array,
      childValue2: {
        type: Object,
        default: { value: "child2" }
      }
    }

    childAction1() {}
    childAction2() {}
  }
`

describe("inheritance", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  test("inherits actions", async () => {
    const parentFile = new SourceFile(project, "parent_controller.js", parentCode)
    const childFile = new SourceFile(project, "child_controller.js", childCode)

    project.projectFiles.push(parentFile)
    project.projectFiles.push(childFile)

    await project.initialize()

    const parent = parentFile.controllerDefinitions[0]
    const child = childFile.controllerDefinitions[0]

    expect(parent).toBeDefined()
    expect(child).toBeDefined()

    expect(parent.localActionNames).toEqual(["parentAction1", "parentAction2"])
    expect(parent.actionNames).toEqual(["parentAction1", "parentAction2"])

    expect(child.localActionNames).toEqual(["childAction1", "childAction2"])
    expect(child.actionNames).toEqual(["childAction1", "childAction2", "parentAction1", "parentAction2"])
  })

  test("inherits targets", async () => {
    const parentFile = new SourceFile(project, "parent_controller.js", parentCode)
    const childFile = new SourceFile(project, "child_controller.js", childCode)

    project.projectFiles.push(parentFile)
    project.projectFiles.push(childFile)

    await project.initialize()

    const parent = parentFile.controllerDefinitions[0]
    const child = childFile.controllerDefinitions[0]

    expect(parent).toBeDefined()
    expect(child).toBeDefined()

    expect(parent.localTargetNames).toEqual(["parentTarget1", "parentTarget2"])
    expect(parent.targetNames).toEqual(["parentTarget1", "parentTarget2"])

    expect(child.localTargetNames).toEqual(["childTarget1", "childTarget2"])
    expect(child.targetNames).toEqual(["childTarget1", "childTarget2", "parentTarget1", "parentTarget2"])
  })

  test("inherits values", async () => {
    const parentFile = new SourceFile(project, "parent_controller.js", parentCode)
    const childFile = new SourceFile(project, "child_controller.js", childCode)

    project.projectFiles.push(parentFile)
    project.projectFiles.push(childFile)

    await project.initialize()

    const parent = parentFile.controllerDefinitions[0]
    const child = childFile.controllerDefinitions[0]

    expect(parent).toBeDefined()
    expect(child).toBeDefined()

    expect(Object.keys(parent.localValues)).toEqual(["parentValue1", "parentValue2"])
    expect(Object.keys(parent.values)).toEqual(["parentValue1", "parentValue2"])
    expect(Object.keys(child.localValues)).toEqual(["childValue1", "childValue2"])
    expect(Object.keys(child.values)).toEqual(["childValue1", "childValue2", "parentValue1", "parentValue2"])

    expect(Object.values(parent.localValues).map(v => [v.type, v.default])).toEqual([
      ["Boolean", false],
      ["String", "parent2"],
    ])

    expect(Object.values(parent.values).map(v => [v.type, v.default])).toEqual([
      ["Boolean", false],
      ["String", "parent2"],
    ])

    expect(Object.values(child.localValues).map(v => [v.type, v.default])).toEqual([
      ["Array", []],
      ["Object", {value: "child2"}]
    ])

    expect(Object.values(child.values).map(v => [v.type, v.default])).toEqual([
      ["Array", []],
      ["Object", {value: "child2"}],
      ["Boolean", false],
      ["String", "parent2"],
    ])
  })

  test("inherits classes", async () => {
    const parentFile = new SourceFile(project, "parent_controller.js", parentCode)
    const childFile = new SourceFile(project, "child_controller.js", childCode)

    project.projectFiles.push(parentFile)
    project.projectFiles.push(childFile)

    await project.initialize()

    const parent = parentFile.controllerDefinitions[0]
    const child = childFile.controllerDefinitions[0]

    expect(parent).toBeDefined()
    expect(child).toBeDefined()

    expect(parent.localClassNames).toEqual(["parentClass1", "parentClass2"])
    expect(parent.classNames).toEqual(["parentClass1", "parentClass2"])

    expect(child.localClassNames).toEqual(["childClass1", "childClass2"])
    expect(child.classNames).toEqual(["childClass1", "childClass2", "parentClass1", "parentClass2"])
  })

  test.skip("inherits outlets", async () => {
    expect(true).toBeTruthy()
  })
})

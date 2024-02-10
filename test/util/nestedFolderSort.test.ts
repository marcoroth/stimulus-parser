import { describe, test, expect } from "vitest"
import { nestedFolderSort } from "../../src/util"

describe("util", () => {
  describe("nestedFolderSort", () => {
    test("empty", () => {
      expect([].sort(nestedFolderSort)).toEqual([])
    })

    test("already sorted", () => {
      expect(["a.js", "b.js"].sort(nestedFolderSort)).toEqual(["a.js", "b.js"])
    })

    test("reverse order", () => {
      expect(["b.js", "a.js"].sort(nestedFolderSort)).toEqual(["a.js", "b.js"])
    })

    test("with uppercase letters", () => {
      expect(["B.js", "a.js"].sort(nestedFolderSort)).toEqual(["a.js", "B.js"])
      expect(["b.JS", "a.JS"].sort(nestedFolderSort)).toEqual(["a.JS", "b.JS"])
      expect(["b.jS", "a.JS"].sort(nestedFolderSort)).toEqual(["a.JS", "b.jS"])
      expect(["b.jS", "A.JS"].sort(nestedFolderSort)).toEqual(["A.JS", "b.jS"])
      expect(["B.jS", "a.JS"].sort(nestedFolderSort)).toEqual(["a.JS", "B.jS"])
    })

    test("same nest level", () => {
      expect(["a/a.js", "a/b.js"].sort(nestedFolderSort)).toEqual(["a/a.js", "a/b.js"])
      expect(["a/a.js", "b/b.js", "b/a.js", "a/b.js"].sort(nestedFolderSort)).toEqual(["a/a.js", "a/b.js", "b/a.js", "b/b.js"])
      expect(["a/a.js", "b/b.js", "b/A.js", "a/B.js"].sort(nestedFolderSort)).toEqual(["a/a.js", "a/B.js", "b/A.js", "b/b.js"])
    })

    test("different nesting levels", () => {
      expect(["1/2/3/a.js", "z.js", "1/a.js", "1/b.js", "1/2/d.js", "1/2/c.js"].sort(nestedFolderSort)).toEqual([
        "z.js",
        "1/a.js",
        "1/b.js",
        "1/2/c.js",
        "1/2/d.js",
        "1/2/3/a.js",
      ])
    })
  })
})

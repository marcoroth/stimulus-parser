import { afterAll } from "vitest"
import { cleanupTempDir } from "./temp"

afterAll(() => {
  cleanupTempDir()
})

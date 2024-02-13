import { vi } from "vitest"

import * as fs from "../../src/util/fs"

export function mockFile(content: string) {
  return vi.spyOn(fs, "readFile").mockReturnValue(new Promise(resolve => resolve(content)))
}

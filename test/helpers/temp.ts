import nodePath from "path"
import nodeFs from "fs"
import { tmpdir } from "os"
import { SourceFile } from "../../src/source_file"
import type { Project } from "../../src/project"

let tempDir: string | undefined

export function getTempDir(): string {
  if (!tempDir) {
    tempDir = nodeFs.mkdtempSync(nodePath.join(tmpdir(), "stimulus-parser-test-"))
  }

  return tempDir
}

export function createTestSourceFile(project: Project, filename: string, content: string): SourceFile {
  const filePath = nodePath.join(project.projectPath, filename)
  const fileDir = nodePath.dirname(filePath)

  nodeFs.mkdirSync(fileDir, { recursive: true })
  nodeFs.writeFileSync(filePath, content)

  return new SourceFile(project, filePath)
}

export function cleanupTempDir() {
  if (tempDir) {
    nodeFs.rmSync(tempDir, { recursive: true, force: true })
    tempDir = undefined
  }
}

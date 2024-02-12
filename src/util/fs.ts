import { promises as fs } from "fs"

export async function resolvePathWhenFileExists(path: string): Promise<string|null> {
  const exists = await folderExists(path)

  return exists ? path : null
}

export async function readFile(path: string): Promise<string> {
  return await fs.readFile(path, "utf8")
}

export async function fileExists(path: string): Promise<boolean> {
  return folderExists(path)
}

export async function folderExists(path: string): Promise<boolean> {
  return new Promise(resolve =>
    fs
      .stat(path)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  )
}

export function nestedFolderSort(a: string, b: string) {
  const aLength = a.split("/").length
  const bLength = b.split("/").length

  if (aLength == bLength) {
    return a.localeCompare(b)
  } else {
    return (aLength > bLength) ? 1 : -1
  }
}

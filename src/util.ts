import path from "path"
import { promises as fs } from "fs"

export function camelize(string: string) {
  return string.replace(/(?:[_-])([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export function dasherize(value: string) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`)
}

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

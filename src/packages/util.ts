import path from "path"

import { folderExists } from "../util"

export async function findPackagePath(startPath: string, packageName: string): Promise<string|null> {
  const nodeModulesPath = await findNodeModulesPath(startPath)

  if (!nodeModulesPath) return null

  return path.join(nodeModulesPath, packageName)
}

export async function findNodeModulesPath(startPath: string): Promise<string|null> {
  const findFolder = async (splits: string[]): Promise<string|null> => {
    if (splits.length == 0) return null

    let possiblePath = path.join(...splits, "node_modules")

    if (!possiblePath.startsWith("/")) possiblePath = `/${possiblePath}`

    const exists = await folderExists(possiblePath)

    if (exists) return possiblePath

    return findFolder(splits.slice(0, splits.length - 1))
  }

  return await findFolder(startPath.split("/"))
}

export function nodeModulesPathFor(nodeModulesPath: string, packageName: string): string {
  return path.join(nodeModulesPath, packageName)
}

export async function hasDepedency(projectPath: string, packageName: string): Promise<boolean> {
  const nodeModulesPath = await findNodeModulesPath(projectPath)

  if (!nodeModulesPath) return false

  const packagePath = nodeModulesPathFor(nodeModulesPath, packageName)

  return await folderExists(packagePath)
}

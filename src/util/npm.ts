import path from "path"
import { glob } from "glob"

import { NodeModule } from "../node_module"

import { readFile, folderExists } from "../util/fs"

import type { Project } from "../project"

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

export async function parsePackageJSON(path: string) {
  const packageJSON = await readFile(path)
  return JSON.parse(packageJSON)
}

export function getTypesForPackageJSON(packageJSON: any): { type: "main"|"module"|"source", entrypoint: string|undefined }[]{
  return [
    { type: "source", entrypoint: packageJSON.source },
    { type: "module", entrypoint: packageJSON.module },
    { type: "main", entrypoint: packageJSON.main }
  ]
}

export function getTypeFromPackageJSON(packageJSON: any) {
  return getTypesForPackageJSON(packageJSON).find(({ entrypoint }) => !!entrypoint) || { type: undefined, entrypoint: undefined }
}

export async function nodeModuleForPackageName(project: Project, name: string): Promise<NodeModule | undefined> {
  const packageJSON = await findPackagePath(project.projectPath, name)

  if (!packageJSON) return

  return nodeModuleForPackageJSONPath(project, path.join(packageJSON, "package.json"))
}

export async function nodeModuleForPackageJSONPath(project: Project, packageJSONPath: string): Promise<NodeModule | undefined> {
  const packageJSON = await parsePackageJSON(packageJSONPath)
  const packageName = packageJSON.name

  const { type, entrypoint } = getTypeFromPackageJSON(packageJSON)

  if (entrypoint && type) {
    const rootFolder = path.dirname(packageJSONPath)
    const entrypointRoot = path.dirname(entrypoint)
    const absoluteEntrypointRoot = path.join(rootFolder, entrypointRoot)
    const files = await glob(`${absoluteEntrypointRoot}/**/*.{js,mjs,cjs}`)

    return new NodeModule(project, {
      name: packageName,
      path: rootFolder,
      entrypoint: path.join(rootFolder, entrypoint),
      controllerRoots: [absoluteEntrypointRoot],
      type,
      files,
    })
  }

  return
}

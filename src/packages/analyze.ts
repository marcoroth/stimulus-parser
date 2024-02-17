import path from "path"
import { glob } from "glob"

import { Project } from "../project"
import { findNodeModulesPath, parsePackageJSON, nodeModuleForPackageJSONPath, hasDepedency } from "../util/npm"

export async function analyzePackage(project: Project, name: string) {
  const nodeModulesPath = await findNodeModulesPath(project.projectPath)

  if (!nodeModulesPath) return
  if (!await hasDepedency(project.projectPath, name)) return

  const packagePath = path.join(nodeModulesPath, name, "package.json")

  return await anylzePackagePath(project, packagePath)
}

export async function anylzePackagePath(project: Project, packagePath: string) {
  const packageJSON = await parsePackageJSON(packagePath)
  const packageName = packageJSON.name

  if (packageName === "@hotwired/stimulus") return
  if (packageName === "@hotwired/stimulus-webpack-helpers") return
  if (packageName === "stimulus-vite-helpers") return
  if (packageName === "vite-plugin-stimulus-hmr") return
  if (packageName === "bun-stimulus-plugin") return
  if (packageName === "esbuild-plugin-stimulus") return

  const nodeModule = await nodeModuleForPackageJSONPath(project, packagePath)

  if (nodeModule) {
    project.detectedNodeModules.push(nodeModule)

    return nodeModule
  }

  return undefined
}

export async function analyzeAll(project: Project) {
  const nodeModulesPath = await findNodeModulesPath(project.projectPath)

  if (!nodeModulesPath) return

  const packages = [
    ...await glob(`${nodeModulesPath}/*stimulus*/package.json`),   // for libraries like stimulus-in-library
    ...await glob(`${nodeModulesPath}/*stimulus*/*/package.json`), // for libraries like @stimulus-in-namespace/some-library
    ...await glob(`${nodeModulesPath}/*/*stimulus*/package.json`), // for libraries like @some-namespace/stimulus-in-library
  ]

  await Promise.allSettled(
    packages.map(packagePath => anylzePackagePath(project, packagePath))
  )
}

import path from "path"
import { glob } from "glob"

import { Project } from "./project"

import { findNodeModulesPath, parsePackageJSON, nodeModuleForPackageJSONPath, hasDepedency } from "./util/npm"

export const helperPackages = [
  "@hotwired/stimulus-loading",
  "@hotwired/stimulus-webpack-helpers",
  "bun-stimulus-plugin",
  "esbuild-plugin-stimulus",
  "stimulus-vite-helpers",
  "vite-plugin-stimulus-hmr",
]

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
  if (helperPackages.includes(packageName)) return

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
    ...await glob(`${nodeModulesPath}/*stimulus*/package.json`),   // for libraries like stimulus-in-library-name
    ...await glob(`${nodeModulesPath}/*stimulus*/*/package.json`), // for libraries like @stimulus-in-namespace-name/some-library
    ...await glob(`${nodeModulesPath}/*/*stimulus*/package.json`), // for libraries like @some-namespace/stimulus-in-library-name
  ]

  await Promise.allSettled(
    packages.map(packagePath => anylzePackagePath(project, packagePath))
  )
}

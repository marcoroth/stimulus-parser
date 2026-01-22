import path from "path"
import { glob } from "glob"

import { Project } from "./project"

import { findNodeModulesPath, parsePackageJSON, nodeModuleForPackageJSONPath, hasDepedency } from "./util/npm"

export const helperPackages = [
  "@hotwired/stimulus-loading",
  "@hotwired/stimulus-webpack-helpers",
  "@symfony/stimulus-bridge",
  "@symfony/stimulus-bundle",
  "bun-stimulus-plugin",
  "esbuild-plugin-stimulus",
  "stimulus-vite-helpers",
  "vite-plugin-stimulus-hmr",
]

export const ignoredPackageNamespaces = [
  "@angular",
  "@babel",
  "@date-fns",
  "@rollup",
  "@types",
]

export const ignoredPackages = [
  ...helperPackages,
  "@hotwired/stimulus",
  "@rails/webpacker",
  "axios",
  "babel-core",
  "boostrap",
  "tailwindcss",
  "babel-eslint",
  "babel-loader",
  "babel-runtime",
  "bun",
  "chai",
  "compression-webpack-plugin",
  "core-js",
  "esbuild-rails",
  "esbuild",
  "eslint",
  "hotkeys-js",
  "jquery",
  "laravel-vite-plugin",
  "lodash",
  "mitt",
  "mocha",
  "moment",
  "postcss",
  "react",
  "rollup",
  "shakapacker",
  "terser-webpack-plugin",
  "typescript",
  "vite-plugin-rails",
  "vite-plugin-ruby",
  "vite",
  "vue",
  "webpack-assets-manifest",
  "webpack-cli",
  "webpack-merge",
  "webpack",
]

export async function analyzePackage(project: Project, name: string) {
  const nodeModulesPath = await findNodeModulesPath(project.projectPath)

  if (!nodeModulesPath) return
  if (!await hasDepedency(project.projectPath, name)) return

  const packagePath = path.join(nodeModulesPath, name, "package.json")

  return await analyzePackagePath(project, packagePath)
}

export function shouldIgnore(name: string): boolean {
  if (ignoredPackages.includes(name)) return true

  return ignoredPackageNamespaces.some(namespace => name.includes(namespace))
}

export async function analyzePackagePath(project: Project, packagePath: string) {
  const packageJSON = await parsePackageJSON(packagePath)
  const packageName = packageJSON.name

  if (shouldIgnore(packageName)) return

  const nodeModule = await nodeModuleForPackageJSONPath(project, packagePath)

  if (nodeModule && !project.detectedNodeModules.map(nodeModule => nodeModule.name).includes(packageName)) {
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
    packages.map(packagePath => analyzePackagePath(project, packagePath))
  )
}

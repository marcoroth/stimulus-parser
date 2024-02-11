import path from "path"
import { glob } from "glob"

import type { NodeModule } from "../types"
import  { Project } from "../project"
import { readFile } from "../util"
import { findNodeModulesPath } from "./util"

export async function analyzeAll(project: Project) {
  const nodeModulesPath = await findNodeModulesPath(project.projectPath)

  if (!nodeModulesPath) return

  const packages = [
    ...await glob(`${nodeModulesPath}/*stimulus*/package.json`),   // for libraries like stimulus-in-library
    ...await glob(`${nodeModulesPath}/*stimulus*/*/package.json`), // for libraries like @stimulus-in-namespace/some-library
    ...await glob(`${nodeModulesPath}/*/*stimulus*/package.json`), // for libraries like @some-namespace/stimulus-in-library
  ]

  await Promise.allSettled(
    packages.map(async packagePath => {
      const folder = path.dirname(packagePath)
      const packageJSON = await readFile(packagePath)
      const parsed = JSON.parse(packageJSON)
      const packageName = parsed.name

      if (packageName === "@hotwired/stimulus") return
      if (packageName === "@hotwired/stimulus-webpack-helpers") return
      if (packageName === "stimulus-vite-helpers") return
      if (packageName === "bun-stimulus-plugin") return
      if (packageName === "esbuild-plugin-stimulus") return

      const source = parsed.source || parsed.module || parsed.main

      if (source) {
        const directory = path.dirname(source)
        const basePath = path.join(folder, directory)
        const files = await glob(`${basePath}/**/*.{js,mjs}`)

        const detectedModule: NodeModule = {
          name: packageName,
          path: packagePath,
          controllerRoots: [basePath]
        }

        project.detectedNodeModules.push(detectedModule)

        await project.readControllerFiles(files)
      }
    })
  )
}

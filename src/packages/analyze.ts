import path from "path"
import { glob } from "glob"

import { NodeModule } from "../node_module"
import { Project } from "../project"
import { readFile } from "../util/fs"
import { findNodeModulesPath } from "../util/npm"

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

      const types = [["source", parsed.source], ["module", parsed.module], ["main", parsed.main]]
      const [type, entrypoint] = types.find(([_type, entrypoint]) => !!entrypoint) || []

      if (entrypoint) {
        const directory = path.dirname(entrypoint)
        const basePath = path.join(folder, directory)
        const files = await glob(`${basePath}/**/*.{js,mjs}`)

        const detectedModule = new NodeModule(project, {
          entrypoint: path.join(folder, entrypoint),
          name: packageName,
          path: packagePath,
          controllerRoots: [basePath],
          type,
          files,
        })

        project.detectedNodeModules.push(detectedModule)

        await project.readSourceFiles(files)
      }
    })
  )
}

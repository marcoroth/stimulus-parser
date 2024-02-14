import path from "path"
import { glob } from "glob"

import type { NodeModule } from "../types"
import  { Project } from "../project"
import { hasDepedency, findPackagePath } from "../util/npm"

export async function analyze(project: Project) {
  const packageName = "tailwindcss-stimulus-components"
  const hasPackage = await hasDepedency(project.projectPath, packageName)
  const packagePath = await findPackagePath(project.projectPath, packageName)

  if (!hasPackage || !packagePath) return

  const basePath = path.join(packagePath, "src")
  const files = await glob(`${basePath}/**/*.js`)

  const detectedModule: NodeModule = {
    entrypoint: path.join(basePath),
    name: packageName,
    path: packagePath,
    controllerRoots: [basePath],
    type: "source",
    files,
  }

  project.detectedNodeModules.push(detectedModule)

  await project.readSourceFiles(files)
}

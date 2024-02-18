import { Project } from "../project"
import { hasDepedency, nodeModuleForPackageName } from "../util/npm"

export async function analyze(project: Project) {
  const packageName = "tailwindcss-stimulus-components"
  const hasPackage = await hasDepedency(project.projectPath, packageName)
  const nodeModule = await nodeModuleForPackageName(project, packageName)

  if (!nodeModule || !hasPackage) return

  project.detectedNodeModules.push(nodeModule)
}

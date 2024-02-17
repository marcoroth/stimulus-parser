import { Project } from "../project"
import { analyzeAll } from "./analyze"
// import * as tailwindcssStimulusComponents from "./tailwindcss-stimulus-components"

export * from "./analyze"

export async function detectPackages(project: Project) {
  // await tailwindcssStimulusComponents.analyze(project)
  await analyzeAll(project)
}

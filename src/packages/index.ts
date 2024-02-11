import  { Project } from "../project"

// import * as tailwindcssStimulusComponents from "./tailwindcss-stimulus-components"
import { analyzeAll } from "./analyze"

export async function detectPackages(project: Project) {
  // await tailwindcssStimulusComponents.analyze(project)
  await analyzeAll(project)
}

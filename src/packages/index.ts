import  { Project } from '../project'

import * as tailwindcssStimulusComponents from "./tailwindcss-stimulus-components"

export async function detectPackages(project: Project) {
  await tailwindcssStimulusComponents.analyze(project)
}

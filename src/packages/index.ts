import { Project } from "../project"
import { analyzeAll } from "./analyze"
// import * as tailwindcssStimulusComponents from "./tailwindcss-stimulus-components"

export * from "./analyze"

export const helperPackages = [
  "@hotwired/stimulus-loading",
  "@hotwired/stimulus-webpack-helpers",
  "bun-stimulus-plugin",
  "esbuild-plugin-stimulus",
  "stimulus-vite-helpers",
  "vite-plugin-stimulus-hmr",
]

export async function detectPackages(project: Project) {
  // await tailwindcssStimulusComponents.analyze(project)
  await analyzeAll(project)
}

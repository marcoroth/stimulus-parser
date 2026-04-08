import path from "path"
import { glob } from "glob"
import { execSync } from "child_process"
import fs from "fs"

const fixtures = await glob("test/fixtures/**/package.json", { ignore: "**/**/node_modules/**" })

fixtures.forEach(async fixturesPath => {
  const fixtureFolder = path.dirname(fixturesPath)

  console.log(`Installing packages for fixture: ${fixtureFolder}`)

  execSync(`cd ${fixtureFolder} && yarn install && cd -`)

  if (fixtureFolder.endsWith("symfony-asset-mapper")) {
    const mockPackagePath = path.join(fixtureFolder, "node_modules", "@symfony", "stimulus-bundle")
    fs.mkdirSync(mockPackagePath, { recursive: true })
    fs.writeFileSync(path.join(mockPackagePath, "package.json"), JSON.stringify({
      name: "@symfony/stimulus-bundle",
      version: "3.2.0",
      main: "loader.js"
    }, null, 2))
    fs.writeFileSync(path.join(mockPackagePath, "loader.js"), "export function startStimulusApp() { return {} }\n")
  }
})

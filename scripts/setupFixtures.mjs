import path from "path"
import { glob } from "glob"
import { execSync } from "child_process"

const fixtures = await glob("test/fixtures/**/package.json", { ignore: "**/**/node_modules/**" })

for (const fixturesPath of fixtures) {
  const fixtureFolder = path.dirname(fixturesPath)

  console.log(`Installing packages for fixture: ${fixtureFolder}`)

  execSync("yarn install", {
    cwd: fixtureFolder,
    stdio: ["ignore", "ignore", "ignore"],
  })
}

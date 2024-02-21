import fs from "fs"
import path from "path"
import express from "express"

import { fileURLToPath } from "url"
import { createServer as createViteServer } from "vite"
import { Project, SourceFile } from "stimulus-parser"

const PORT = 5173
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const headers = { "Content-Type": "application/json" }

async function createServer() {
  const app = express()

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom"
  })

  app.use(vite.middlewares)
  app.use(express.json())

  app.post("/api/analyze", (request, response) => {
    try {
      const project = new Project("dummy")
      const sourceFile = new SourceFile(project, "demo_controller.js", request.body?.controller)

      sourceFile.initialize()
      sourceFile.analyze()

      response.status(200).set(headers).end(JSON.stringify(sourceFile.inspect))
    } catch(e) {
      response.status(500).set(headers).end(JSON.stringify({ error: e.message }))
    }
  });

  app.use("*", async (request, response, next) => {
    try {
      const template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8")

      response.status(200).set({ "Content-Type": "text/html" }).end(template)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      next(e)
    }
  })

  console.log(`Listening on port ${PORT}`)
  app.listen(PORT)
}

createServer()

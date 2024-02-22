import express from "express"
import { Project, SourceFile } from "stimulus-parser"

const headers = { "Content-Type": "application/json" }

const app = express()
app.use(express.json())

app.post("/api/analyze", (request, response) => {
  try {
    const project = new Project("playground")
    const sourceFile = new SourceFile(project, "playground_controller.js", request.body?.controller)

    sourceFile.initialize()
    sourceFile.analyze()

    response.status(200).set(headers).end(JSON.stringify(sourceFile.inspect))
  } catch(e) {
    response.status(500).set(headers).end(JSON.stringify({ error: e.message }))
  }
});

export { app }

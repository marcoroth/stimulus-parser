import express from "express"
import { Project, SourceFile, ClassDeclaration, ControllerDefinition, ExportDeclaration, ImportDeclaration } from "stimulus-parser"

const headers = { "Content-Type": "application/json" }

const app = express()
app.use(express.json())

function replacer(key, value) {
  if (key === "project") return undefined
  if (this instanceof SourceFile && key === "content") return undefined
  if (this instanceof ImportDeclaration && key === "sourceFile") return undefined
  if (this instanceof ExportDeclaration && key === "sourceFile") return undefined
  if (this instanceof ClassDeclaration && key === "sourceFile") return undefined
  if (this instanceof ControllerDefinition && key === "classDeclaration") return undefined

  return value
}

app.post("/api/analyze", (request, response) => {
  try {
    const project = new Project("playground")
    const sourceFile = new SourceFile(project, "playground_controller.js", request.body?.controller)

    sourceFile.initialize()
    sourceFile.analyze()

    response.status(200).set(headers).end(JSON.stringify({ simple: sourceFile.inspect, full: sourceFile }, replacer))
  } catch(e) {
    response.status(500).set(headers).end(JSON.stringify({ error: e.message }))
  }
});

export { app }

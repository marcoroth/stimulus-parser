import { Project, SourceFile } from "stimulus-parser"

export default function handler(request, response) {
  console.log(request.query)

  try {
    const project = new Project("playground")
    const sourceFile = new SourceFile(project, "playground_controller.js", request.body?.controller)

    sourceFile.initialize()
    sourceFile.analyze()

    response.json(sourceFile.inspect)
  } catch(e) {
    response.json({ error: e.message })
  }
}

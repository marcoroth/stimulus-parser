import fs from "fs"
import path from "path"
import express from "express"

import { fileURLToPath } from "url"
import { app } from "./app.mjs"

const PORT = process.env.PORT || 5173

app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist/client"), { index: false }))

const template = fs.readFileSync("./dist/client/index.html", "utf-8")

app.use("*", (request, response, next) => {
  response.status(200).set({ "Content-Type": "text/html" }).end(template)
})

app.listen(PORT, () => {
  console.log(`Listing on http://localhost:${PORT}`)
})

import fs from "fs"
import path from "path"
import express from "express"

import { fileURLToPath } from "url"
import { app } from "./app.mjs"

app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist/client"), { index: false }))

app.use("*", async (request, response, next) => {
  try {
    const template = fs.readFileSync("./dist/client/index.html", "utf-8")

    response.status(200).set({ "Content-Type": "text/html" }).end(template)
  } catch (error) {
    response.status(500).end(error)
  }
})

app.listen(5173, () => {
  console.log("Listing on http://localhost:5173")
})

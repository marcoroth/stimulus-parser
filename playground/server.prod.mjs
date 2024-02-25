import fs from "fs"
import path from "path"
import express from "express"

import { fileURLToPath } from "url"
import { app } from "./app.mjs"

const PORT = process.env.PORT || 5173

app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dist/client")))

app.listen(PORT, () => {
  console.log(`Listing on http://localhost:${PORT}`)
})

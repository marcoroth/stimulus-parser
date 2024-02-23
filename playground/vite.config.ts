import path from "path"

export default {
  resolve: {
    alias: {
      "stimulus-parser": path.resolve(__dirname, "../dist/index.js"),
    },
  },
}

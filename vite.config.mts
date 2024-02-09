import { defineConfig } from "vite"

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: "./src/index.ts",
      formats: ["cjs"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "fs",
        "fs/promises",
        "events",
        "string_decoder",
        "url",
        "buffer",
        "stream",
        "os",
        "util",
      ],
    },
    target: "node18",
    minify: false,
    sourcemap: false,
  },
});

import { defineConfig } from "vite"
import rails from "vite-plugin-rails"

export default defineConfig({
  plugins: [
    rails({
      envVars: {
        HEROKU_RELEASE_VERSION: "development",
        HEROKU_SLUG_COMMIT: "main",
      },
    }),
  ],
})

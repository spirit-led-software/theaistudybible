import { defineConfig } from "@solidjs/start/config";
import { cjsInterop } from "vite-plugin-cjs-interop";

export default defineConfig({
  middleware: "./src/middleware.ts",
  vite: {
    plugins: [
      cjsInterop({
        dependencies: ["@clerk/clerk-js"],
      }),
    ],
  },
});

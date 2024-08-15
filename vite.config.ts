import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const packageJson = JSON.parse(
  readFileSync("./package.json", { encoding: "utf-8" })
);

const globals = {
  ...(packageJson.dependencies || {}),
};

function resolve(str: string) {
  return path.resolve(__dirname, str);
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve("./src/index.ts"),
      name: "cloudflare-images-kit",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [...Object.keys(globals)],
    },
  },
  plugins: [
    dts({
      exclude: ["**/tests/**/*", "**/demo/**/*"],
    }),
  ],
});

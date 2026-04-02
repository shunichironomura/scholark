import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  fmt: {},
  lint: {"options":{"typeAware":true,"typeCheck":true}},
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});

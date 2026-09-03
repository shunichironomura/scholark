import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    plugins: ["react", "jsx-a11y"],
    options: { typeAware: true, typeCheck: true },
  },
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: { SCHOLARK_SESSION_SECRET: "test-session-secret" },
  },
  plugins: [tailwindcss(), reactRouter()],
});

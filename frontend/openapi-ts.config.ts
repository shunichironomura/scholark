import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:8000/api/v1/openapi.json",
  output: "./app/client",
  parser: {
    patch: {
      input: (spec) => {
        // The generated client gets its runtime base URL from VITE_API_URL.
        // Remove codegen server hints so the local generation URL does not
        // appear in generated types.
        if ("openapi" in spec) {
          spec.servers = [];
        }
      },
    },
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      baseUrl: false,
      runtimeConfigPath: "./app/hey-api",
    },
  ],
});

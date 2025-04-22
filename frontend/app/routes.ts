import type { RouteConfig } from "@react-router/dev/routes";
import { route, index, layout } from "@react-router/dev/routes";

export default [
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    route("conferences", "routes/conferences.tsx"),
  ])
] satisfies RouteConfig;

import type { RouteConfig } from "@react-router/dev/routes";
import { route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("conferences", "routes/conferences.tsx"),
] satisfies RouteConfig;

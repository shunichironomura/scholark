import type { RouteConfig } from "@react-router/dev/routes";
import { route, index, layout } from "@react-router/dev/routes";

export default [
  layout("layouts/main.tsx", [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("register", "routes/register.tsx"),
    route("conferences", "routes/conferences.tsx"),
    route("conferences/new", "routes/create-conference.tsx"),
    route("conferences/:conferenceId/edit", "routes/edit-conference.tsx"),
    route("conferences/:conferenceId/delete", "routes/delete-conference.tsx"),
  ])
] satisfies RouteConfig;

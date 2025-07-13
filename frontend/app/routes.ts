import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

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
    route("conferences/:conferenceId/tags", "routes/conference-tags.tsx"),
    route("timeline", "routes/timeline.tsx"),
    route("settings", "routes/settings.tsx"),
    route("tags/new", "routes/create-tag.tsx"),
    route("tags/:tagId/edit", "routes/edit-tag.tsx"),
    route("tags/:tagId/delete", "routes/delete-tag.tsx"),
  ]),
] satisfies RouteConfig;

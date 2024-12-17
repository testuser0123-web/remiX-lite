import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signup", "routes/signup.tsx"),
  route("login", "routes/login.tsx"),
  route(":id/edit", "routes/edit.tsx"),
  route("post", "routes/post.tsx"),
] satisfies RouteConfig;

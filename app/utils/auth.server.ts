import type { User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { login } from "./login.server";

export const authenticator = new Authenticator<Omit<User, "password">>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email");
    const password = form.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Invalid Request");
    }

    const user = await login(String(email), String(password));
    if (!user) {
      throw new Error("メールアドレスまたはパスワードが間違っています。");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }),
  "user-pass"
);

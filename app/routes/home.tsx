import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/home";
import { sessionStorage } from "~/utils/session.server";
import type { User } from "@prisma/client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ホーム" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return (
    <div className="h-screen flex flex-col gap-4 items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1 className="font-extrabold text-5xl">Hello World!</h1>
      <p className="font-bold text-xl">
        Welcome, <span className="text-[hsl(280,100%,70%)]">{user.name}</span> !
      </p>
      <Link to="post" className="font-bold text-md">
        <button className="bg-[hsl(280,100%,70%)] p-2 rounded-md font-semibold text-xl">
          ポストを見る
        </button>
      </Link>
      <Form method="post">
        <button
          type="submit"
          className="bg-[hsl(280,100%,70%)] p-2 rounded-md font-semibold text-xl"
        >
          ログアウト
        </button>
      </Form>
      <Link to={`${user.id}/edit`} className="underline hover:text-purple-200">
        名前を変更する
      </Link>
    </div>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  let user = session.get("user") as Omit<User, "password">;
  if (!user) throw redirect("/login");
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}

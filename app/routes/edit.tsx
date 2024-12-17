import { db } from "~/prisma";
import type { Route } from "./+types/edit";
import { TextField } from "~/TextField/TextField";
import { getFormProps, useForm } from "@conform-to/react";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, redirect } from "react-router";
import { sessionStorage } from "~/utils/session.server";
import type { User } from "@prisma/client";

const schema = z.object({
  name: z
    .string({ required_error: "文字を入力してください。" })
    .max(100, "名前が長すぎます。"),
});

export default function Edit({ loaderData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    lastResult: undefined,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });
  const { name } = loaderData;

  return (
    <div className="h-screen flex flex-col gap-4 items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex flex-col gap-4 items-center"
      >
        <TextField
          field={fields.name}
          label="name"
          type="text"
          defaultValue={name}
        />
        <button
          type="submit"
          className="bg-[hsl(280,100%,70%)] p-2 rounded-md font-bold text-xl"
        >
          変更
        </button>
      </Form>
    </div>
  );
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.clone().formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { password: _, ...user } = await db.user.update({
    where: { id: parseInt(params.id) },
    data: {
      name: submission.value.name,
    },
  });

  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  session.set("user", user);

  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const id = parseInt(params.id);
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionUser = session.get("user") as Omit<User, "password">;
  if (sessionUser.id === user.id) {
    return { name: user.name };
  } else {
    throw redirect("/");
  }
}

import {
  getFormProps,
  useForm,
  type SubmissionResult,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { data, Form, Link, redirect, useActionData } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/signup";
import { TextField } from "~/TextField/TextField";
import { createUser } from "~/utils/signup.server";
import { authenticator } from "~/utils/auth.server";
import { sessionStorage } from "~/utils/session.server";

const SignUpSchema = z.object({
  name: z
    .string({ required_error: "文字を入力してください。" })
    .max(100, "名前が長すぎます。"),
  email: z
    .string({ required_error: "文字を入力してください。" })
    .email("正しいメールアドレスを入力してください。"),
  password: z
    .string({ required_error: "文字を入力してください。" })
    .min(8, "パスワードが短すぎます。")
    .max(100, "パスワードが長すぎます。")
    .refine(
      (password: string) => /[A-Za-z]/.test(password) && /[0-9]/.test(password),
      "パスワードは半角英数字の両方を含めてください。"
    ),
});

function isSubmissionResult(result: unknown): result is SubmissionResult {
  return (
    result !== null &&
    typeof result === "object" &&
    "status" in result &&
    typeof result.status !== "number"
  );
}

export default function SignUp() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(SignUpSchema),
    lastResult: isSubmissionResult(lastResult) ? lastResult : undefined,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: SignUpSchema });
    },
  });

  return (
    <div className="h-screen flex flex-col gap-8 items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <h1 className="font-extrabold text-5xl">アカウント作成</h1>
      <Form
        {...getFormProps(form)}
        method="post"
        className="flex flex-col gap-4 items-center"
      >
        <div id={form.errorId} className="text-red-300">
          {form.errors}
        </div>
        <TextField field={fields.name} label="名前" type="text" />
        <TextField field={fields.email} label="メールアドレス" type="email" />
        <TextField field={fields.password} label="パスワード" type="password" />
        <button
          type="submit"
          className="bg-[hsl(280,100%,70%)] p-2 rounded-md font-bold text-xl"
        >
          作成
        </button>
      </Form>
      <div>
        <Link to="/login" className="underline hover:text-purple-200">
          アカウントをお持ちの方はこちら
        </Link>
      </div>
    </div>
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.clone().formData();
  const submission = parseWithZod(formData, { schema: SignUpSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const result = await createUser({
    name: submission.value.name,
    email: submission.value.email,
    password: submission.value.password,
  });

  if (result.error) {
    return submission.reply({
      formErrors: ["メールアドレスはすでに登録済みです"],
    });
  }

  const user = await authenticator.authenticate("user-pass", request);

  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  session.set("user", user);

  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  let user = session.get("user");
  if (user) throw redirect("/");
  return data(null);
}

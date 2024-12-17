import { db } from "~/prisma";
import type { Route } from "./+types/post";
import { data, Form, redirect, useActionData, useFetcher } from "react-router";
import { z } from "zod";
import {
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
  type SubmissionResult,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { sessionStorage } from "~/utils/session.server";
import type { User } from "@prisma/client";
import { useEffect, useState } from "react";

const postSchema = z.object({
  content: z
    .string({ required_error: "文字を入力してください。" })
    .min(1, "文字を入力してください。")
    .max(140, "140文字以内で入力してください。"),
  intent: z.string({ required_error: "意図しない動作です。" }),
});

const likeSchema = z.object({
  postId: z.preprocess(
    (v) => Number(v),
    z.number({ required_error: "正しいpostIdを入力してください。" })
  ),
  intent: z.string({ required_error: "意図しない動作です。" }),
});

function isSubmissionResult(result: unknown): result is SubmissionResult {
  return (
    result !== null &&
    typeof result === "object" &&
    "status" in result &&
    typeof result.status !== "number"
  );
}

export default function Post({ loaderData }: Route.ComponentProps) {
  const [inputValue, setInputValue] = useState("");
  const { postsWithLike } = loaderData;
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    constraint: getZodConstraint(postSchema),
    // lastResult: isSubmissionResult(lastResult) ? lastResult : undefined,
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: postSchema });
    },
  });
  useEffect(() => {
    if (lastResult?.status === 200) {
      setInputValue("");
    }
  }, [lastResult]);

  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="w-96 mt-16">
        <div className="flex flex-col gap-4 items-center justify-center">
          <Form
            {...getFormProps(form)}
            method="post"
            className="w-full flex flex-col gap-2 items-end"
          >
            <div id={form.errorId} className="text-red-300">
              {form.errors}
            </div>
            <textarea
              {...getTextareaProps(fields.content)}
              className="w-full h-40 text-black rounded-md p-1 resize-none"
              placeholder="今何してる？"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
            />
            <input
              {...getInputProps(fields.intent, { type: "hidden" })}
              value="createPost"
            />
            <div id={fields.content.errorId} className="text-red-300">
              {fields.content.errors}
            </div>
            <button
              type="submit"
              className="p-2 rounded-md bg-[hsl(280,100%,70%)]"
            >
              投稿
            </button>
          </Form>
          {postsWithLike.length ? (
            postsWithLike.map((post) => {
              return (
                <div key={post.id} className="w-full border-t pt-1">
                  <p className="font-semibold">{post.author.name}</p>
                  <p>{post.content}</p>
                  <div className="flex justify-between mt-2">
                    <Form method="post" className="flex gap-1">
                      <input type="hidden" name="intent" value="likePost" />
                      <input type="hidden" name="postId" value={post.id} />
                      <button type="submit">{post.isLiked ? "❤" : "♡"}</button>
                      <span>{post.like || ""}</span>
                    </Form>
                    <p className="text-sm text-right">
                      {new Date(post.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p>投稿がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie")
  );
  const user = session.get("user") as Omit<User, "password">;
  const authorId = user.id;
  const formData = await request.formData();
  if (formData.get("intent") === "createPost") {
    const submission = parseWithZod(formData, { schema: postSchema });

    if (submission.status !== "success") {
      return submission.reply();
    }

    await db.post.create({
      data: {
        content: submission.value.content,
        authorId,
      },
    });
    return { status: 200, message: "OK" };
  }
  if (formData.get("intent") === "likePost") {
    const submission = parseWithZod(formData, { schema: likeSchema });

    if (submission.status !== "success") {
      return submission.reply();
    }

    const like = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: submission.value.postId,
        },
      },
    });

    if (like) {
      await db.like.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId: submission.value.postId,
          },
        },
      });
    } else {
      await db.like.create({
        data: {
          userId: user.id,
          postId: submission.value.postId,
        },
      });
    }
    return data(null);
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  let session = await sessionStorage.getSession(request.headers.get("cookie"));
  let user = session.get("user") as Omit<User, "password">;
  if (!user) throw redirect("/login");

  const posts = await db.post.findMany({
    include: {
      author: true,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    take: 10,
  });

  const postsWithLike = await Promise.all(
    posts.map(async (post) => {
      const like = await db.like.count({
        where: {
          postId: post.id,
        },
      });
      const isLiked = await db.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });
      return { ...post, like, isLiked: isLiked ? true : false };
    })
  );
  return { postsWithLike };
}

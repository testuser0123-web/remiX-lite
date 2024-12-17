import { PrismaClient } from "@prisma/client";

// グローバルオブジェクトを型アサーションで拡張
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// PrismaClientインスタンスをグローバルに保持
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["info", "warn", "error"], // 必要に応じてログ設定
  });

// 開発環境ではグローバル変数を使ってインスタンスを再利用
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

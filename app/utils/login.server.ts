import { db } from "~/prisma";
import bcrypt from "bcryptjs";

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (user?.password) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
      return user;
    }
  }

  return null;
}

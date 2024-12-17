import bcrypt from "bcryptjs";
import { db } from "~/prisma";

export interface User {
  name: string;
  email: string;
  password: string;
}

export const createUser = async (data: User) => {
  const { name, email, password } = data;

  if (!(name && email && password)) {
    throw new Error("Invalid Input");
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: { message: "このメールアドレスは既に使われています。" } };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { email: newUser.email };
};

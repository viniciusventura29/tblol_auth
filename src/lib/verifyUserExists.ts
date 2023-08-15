import { prisma } from "./prisma";

const verifyUserExists = async ({ email }: { email: string }) => {
  const userExist = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  return userExist;
};

export {verifyUserExists}
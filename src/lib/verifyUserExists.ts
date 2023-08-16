import { prisma } from "./prisma";

const verifyUserExists = async (
  props: { email: string } | { id: string } | { nickname: string }
) => {
  if ("id" in props) {
    const userExist = await prisma.user.findFirst({
      where: {
        id: props.id,
      },
    });

    return userExist;
  }

  if ("email" in props) {
    const userExist = await prisma.user.findFirst({
      where: {
        email: props.email,
      },
    });

    return userExist;
  }

  if ("nickname" in props) {
    const userExist = await prisma.user.findFirst({
      where: {
        nickname: props.nickname,
      },
    });

    return userExist;
  }
};

export { verifyUserExists };

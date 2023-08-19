import { Request } from "express";
import { prisma } from "./prisma";

const VerifyIsAthenticated = async ({ req }: { req: Request }) => {
  const sessionId = req.cookies;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session
    .findFirst({ where: { userId: sessionId } }).catch(err=>{return null})

  if (!session) {
    return null;
  }

  return { session };
};

export { VerifyIsAthenticated };

import { Request } from "express";
import { prisma } from "./prisma";

const VerifyIsAthenticated = async ({ req }: { req: Request }) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findFirst({ where: { id: sessionId } });

  if (!session) {
    return null;
  }

  return { session};
};

export { VerifyIsAthenticated };

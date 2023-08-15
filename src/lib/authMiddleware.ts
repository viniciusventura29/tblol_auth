import { Request } from "express";
import { prisma } from "./prisma";

const VerifyIsAthenticated = async ({ req }: { req: Request }) => {
  const sessioId = req.cookies.sessionId;

  if (!sessioId) {
    return null;
  }

  const user = await prisma.session.findFirst({ where: { id: sessioId } });

  if (!user) {
    return null;
  }

  return { user, sessioId };
};

export { VerifyIsAthenticated };

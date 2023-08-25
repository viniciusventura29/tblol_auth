import express from "express";
import { prisma } from "./lib/prisma";
import { verifyUserExists } from "./lib/verifyUserExists";
import cookieParser from "cookie-parser";
import { VerifyIsAthenticated } from "./lib/authMiddleware";
import cors from "cors";
import { z } from "zod";
const port = 4000;
const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "Hello World!" });
});

app.post("/newUser", async (req, res) => {
  const newUser = z
    .object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
      nickname: z.string(),
      adm : z.boolean()
    })
    .safeParse(req.body);

  if (!newUser.success) {
    return res.status(400).json(newUser.error);
  }

  const userExistByEmail = await verifyUserExists({
    email: newUser.data.email,
  });

  if (userExistByEmail) {
    return res
      .status(404)
      .json("User already registered! Email have to be unique");
  }

  const userExistByNickname = await verifyUserExists({
    nickname: newUser.data.nickname,
  });

  if (userExistByNickname) {
    return res
      .status(404)
      .json("Nickname already in use! Nickname have to be unique");
  }

  const user = await prisma.user.create({
    data: {
      email: newUser.data.email,
      name: newUser.data.name,
      password: newUser.data.password,
      adm: newUser.data.adm,
      coins: 0,
      image: "",
      level: 1,
      playersId: "",
      nickname: newUser.data.nickname,
    },
  });

  if (!user) {
    throw new Error("Invalid User");
  }

  return res.status(200).json(user);
});

app.get("/allUsers", async (req, res) => {
  const users = await prisma.user.findMany();

  return res.json(users);
});

app.post("/login", async (req, res, next) => {
  const user = z
    .object({
      email: z.string().email(),
      password: z.string(),
    })
    .safeParse(req.body);

  if (!user.success) {
    return res.status(400).json(user.error);
  }

  const userExist = await verifyUserExists({ email: user.data.email });

  if (!userExist) {
    return res.status(404).json("Email not registered");
  }

  const userAuth = user.data.password === userExist.password;

  if (!userAuth) {
    return res.status(403).json("Wrong Password");
  }

  const isAuth = await VerifyIsAthenticated({ req });

  if (isAuth) {
    return res.status(200).json(userExist);
  }

  const session = await prisma.session.create({
    data: { userId: userExist.id },
  });

  return res.cookie("sessionId", session.id).json(userExist).send();
});

app.get("/me", async (req, res) => {
  const isAuth = await VerifyIsAthenticated({ req });

  if (!isAuth) {
    return res.status(400).json("User not logged");
  }

  const user = await verifyUserExists({ id: isAuth.session.userId });

  if (!user) {
    return res.status(400).json("User not found");
  }

  return res.status(200).json(user);
});

app.post("/logout", async (req, res) => {
  const isAuth = await VerifyIsAthenticated({ req });

  if (!isAuth) {
    return res.status(400).json("User not logged");
  }

  await prisma.session.delete({ where: { id: isAuth.session.id } });

  return res.clearCookie("sessionId").status(200).json("Logout");
});

app.post("/addPlayer", async (req, res) => {
  const session = await VerifyIsAthenticated({ req });

  if (!session) {
    return res.status(404).json("You are not logged");
  }

  const user = z
    .object({
      playerid: z.string(),
    })
    .safeParse(req.body);

  if (!user.success) {
    return res.status(400).send("User id not valid!");
  }

  const oldUser = await prisma.user.findUnique({
    where: { id: session?.session.userId },
  });

  const playersId = oldUser?.playersId.split(",");

  if (playersId !== undefined && playersId?.length >= 5) {
    return res.status(400).json("Your team is full");
  }

  if (playersId?.includes(user.data.playerid)) {
    return res.status(400).json("This player already is in your");
  }

  playersId?.push(user.data.playerid);

  const userUpdated = await prisma.user.update({
    data: {
      playersId: playersId?.join(","),
    },
    where: {
      id: session?.session.userId,
    },
  });

  console.log((await userUpdated).playersId);

  return res.status(200).json(userUpdated);
});

app.post("/removePlayer", async (req, res) => {
  const session = await VerifyIsAthenticated({ req });

  if (!session) {
    return res.status(404).json("You are not logged");
  }

  const user = z
    .object({
      playerid: z.string(),
    })
    .safeParse(req.body);

  if (!user.success) {
    return res.status(400).send("User id not valid!");
  }

  const oldUser = await prisma.user.findUnique({
    where: { id: session?.session.userId },
  });

  const playersId = oldUser?.playersId.split(",");

  if (!playersId?.includes(user.data.playerid)){
    return res.status(400).json("You don't own this player")
  }

  const newPlayersIds = playersId.filter((p)=>{p === user.data.playerid})

  console.log(newPlayersIds)

  const userUpdated = await prisma.user.update({
    data: {
      playersId: newPlayersIds?.join(","),
    },
    where: {
      id: session?.session.userId,
    },
  });

  console.log((await userUpdated).playersId);

  return res.status(200).json(userUpdated);
});

app.put("/editUser", async (req,res)=>{
  const editUserResult= z.object({
    name: z.string(),
    password: z.string(),
    nickname: z.string(),
    image: z.string()
  }).partial()
  .refine(({ name, password, nickname, image }) => name || password || nickname || image , {
    message: "You must provide at least one field",
  })
  .safeParse(req.body);

  if (!editUserResult.success) {
    return res.status(400).json({
      message: "Body not formatted correctly",
      error: editUserResult.error,
    });
  }

  return res.status(200)
})



app.listen(port, () =>
  console.log(`"Server is running in http://localhost:${port}"`)
);

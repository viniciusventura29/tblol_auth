import express from "express";
import { prisma } from "./lib/prisma";
import { verifyUserExists } from "./lib/verifyUserExists";
import cookieParser from "cookie-parser";
import { VerifyIsAthenticated } from "./lib/authMiddleware";
import cors, { CorsOptions } from "cors";
const corsOptions: CorsOptions = {
  origin: "*",
  credentials: true,
  allowedHeaders: "*",
  methods: "*",
};
const port = 4000;
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  return res.json({ message: "Hello World!" });
});

app.post("/newUser", async (req, res) => {
  const { name, email, password, nickname } = req.body;

  const userExistByEmail = await verifyUserExists({ email });

  if (userExistByEmail) {
    return res
      .status(404)
      .json("User already registered! Email have to be unique");
  }

  const userExistByNickname = await verifyUserExists({ nickname });

  if (userExistByNickname) {
    return res
      .status(404)
      .json("Nickname already in use! Nickname have to be unique");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password,
      adm: false,
      coins: 0,
      image: "",
      level: 1,
      nickname,
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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userExist = await verifyUserExists({ email });

  if (!userExist) {
    return res.status(404).json("Email not registered");
  }

  const userAuth = password === userExist.password;

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

app.listen(port, () =>
  console.log(`"Server is running in http://localhost:${port}"`)
);

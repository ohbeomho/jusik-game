import "dotenv/config";
import express from "express";
import prisma from "./prisma/index.js";
import wrap from "./utils/asyncWrapper.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectMemjs from "connect-memjs";
import userRouter from "./routers/userRouter.js";
import stockRouter from "./routers/stockRouter.js";

const app = express();
const MemcachedStore = connectMemjs(session);

const { SESSION_SECRET, MEM_SERVER, MEM_USERNAME, MEM_PASSWORD } = process.env;

app.use(morgan("tiny"));
app.use(cookieParser());
app.use(
  session({
    secret: SESSION_SECRET,
    store: new MemcachedStore({
      servers: [MEM_SERVER],
      username: MEM_USERNAME,
      password: MEM_PASSWORD
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      // 24시간
      maxAge: 86400 * 1000
    }
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("./public"));
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.set("view engine", "ejs");
app.set("views", "./views");

app.get(
  "/leaderboard",
  wrap(async (_, res) => {
    const top10 = await prisma.user.findMany({ orderBy: { credits: "desc" }, take: 10 });
    res.render("leaderboard", { top10 });
  })
);

app.get(
  "/stocks",
  wrap(async (_, res) => {
    const stocks = await prisma.stock.findMany({ orderBy: { currentPrice: "desc" } });
    res.render("stock", { stocks });
  })
);

app.get("/", (_, res) => res.render("index"));

app.use("/user", userRouter);
app.use("/stock", stockRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port " + PORT));

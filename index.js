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
import cron from "node-cron";

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
  res.locals.loggedUser = req.session.user;
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
    res.render("stocks", { stocks });
  })
);

app.get("/", (_, res) => res.render("index"));

app.use("/user", userRouter);
app.use("/stock", stockRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port " + PORT));

const MIN_VALUE = 1000;
const MAX_VALUE = 20000;

// TODO: Improve stock updating code
cron.schedule("*/5 * * * *", async () => {
  await Promise.all(
    (await prisma.stock.findMany({})).map(async (stock) => {
      const { id, currentPrice, priceHistory } = stock;
      const halfIndex = Math.floor(priceHistory.length / 2);
      const startIndex = halfIndex < 0 ? 0 : halfIndex;
      const halfHistory = priceHistory.slice(startIndex);
      let max = -Infinity;
      let avg;

      if (!priceHistory.length) {
        max = 100;
        avg = 50;
      } else {
        avg =
          halfHistory
            .map((price, i) => {
              const change = i === 0 ? 0 : price - halfHistory[i - 1];
              const changeAbs = Math.abs(change);
              if (changeAbs > max) {
                max = changeAbs;
              }

              return change;
            })
            .slice(1)
            .reduce((sum, current) => sum + current) / 5;
      }

      console.log(avg, max);
      const isMinus = Math.random() * 100 < [20, 80][avg < 0 ? 0 : 1];
      const big = Math.random() * 100 > 90;
      const veryBig = Math.random() * 100 > 99.5;
      let change = Math.floor(
        ((Math.random() * Math.abs(avg / max) * (isMinus ? -1 : 1) * currentPrice) / (MAX_VALUE - MIN_VALUE)) * 50000
      );

      if (veryBig || big) {
        const v = Math.max(200, Math.abs(change));
        if (veryBig) {
          change = v * 20;
        } else if (big) {
          change = v * 5;
        }
      }

      let newPrice = currentPrice + change;

      if (newPrice > MAX_VALUE) {
        newPrice = MAX_VALUE;
      } else if (newPrice < MIN_VALUE) {
        newPrice = MIN_VALUE;
      }

      if (priceHistory.length >= 50) {
        priceHistory.splice(0, 1);
      }

      priceHistory.push(currentPrice);

      await prisma.stock.update({
        where: { id },
        data: {
          currentPrice: newPrice,
          priceHistory
        }
      });

      await prisma.userStock.updateMany({
        where: {
          stockId: id
        },
        data: {
          totalCredits: {
            multiply: currentPrice / newPrice
          }
        }
      });
    })
  );

  await Promise.all(
    (await prisma.user.findMany({ include: { stocks: true } })).map(async (user) => {
      const { stocks } = user;

      await prisma.user.update({
        where: {
          username: user.username
        },
        data: {
          totalCredits: stocks.reduce((sum, stock) => sum + stock.totalCredits)
        }
      });
    })
  );
});

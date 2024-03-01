import express from "express";
import prisma from "./prisma";
import wrap from "./utils/wrapper";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.get(
  "/stocks",
  wrap(async (_, res) => {
    const stocks = await prisma.stock.findMany({ orderBy: { currentPrice: "desc" } });
    res.render("stocks", { stocks });
  })
);

app.get(
  "/leaderboard",
  wrap(async (_, res) => {
    const top10 = await prisma.user.findMany({ orderBy: { credits: "desc" }, take: 10 });
    res.render("leaderboard", { top10 });
  })
);

app.get("/", (_, res) => res.render("index"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port " + PORT));

import express from "express";
import prisma from "./prisma";
import wrap from "./utils/wrapper";

const app = express();

app.get(
  "/stocks",
  wrap(async (_, res) => {
    const stocks = await prisma.stock.findMany({ orderBy: { currentPrice: "desc" } });
    res.json(stocks);
  })
);

app.get(
  "/leaderboard",
  wrap(async (_, res) => {
    const top10 = await prisma.user.findMany({ orderBy: { credits: "desc" }, take: 10 });
    res.json(top10);
  })
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port " + PORT));

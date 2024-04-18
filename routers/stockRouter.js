import { Router } from "express";
import prisma from "../prisma/index.js";
import wrap from "../utils/asyncWrapper.js";

const router = Router();

const auth = (req, res, next) => {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  next();
};

async function getStock(id) {
  const stock = await prisma.stock.findFirst({
    where: { id },
    select: { id: true, priceHistory: true, currentPrice: true }
  });

  return { ...stock, currentPrice: BigInt(stock.currentPrice) };
}

async function getUserStock(stockId, username) {
  const userStock = await prisma.userStock.findFirst({
    where: { stockId, username },
    select: { id: true, quantity: true, totalCredits: true }
  });

  return userStock ? { ...userStock, totalCredits: BigInt(userStock.totalCredits), quantity: BigInt(userStock.quantity) } : null;
}

router.get(
  "/",
  wrap(async (req, res) => {
    const { stockId } = req.query;
    if (!stockId) {
      throw { message: "주식 ID가 주어지지 않았습니다.", code: 401 };
    }

    const stock = await prisma.stock.findFirst({
      where: {
        id: Number(stockId)
      },
      include: {
        users: {
          select: {
            username: true,
            quantity: true
          }
        }
      }
    });
    res.render("stock", { stock });
  })
);

router.post(
  "/buy",
  auth,
  wrap(async (req, res) => {
    let { stockId, quantity } = req.body;
    stockId = Number(stockId);

    const username = req.session.user;
    const stock = await getStock(stockId);
    const userStock = await getUserStock(stockId, username);
    const user = await prisma.user.findFirst({ where: { username } });
    user.credits = BigInt(user.credits);

    if (quantity === "all") {
      quantity = user.credits / stock.currentPrice;
    } else if (quantity === "half") {
      quantity = user.credits / stock.currentPrice / 2n;
    } else {
      quantity = BigInt(quantity);
    }

    if (user.credits < stock.currentPrice * quantity) {
      throw { message: "잔액이 부족합니다.", code: 401 };
    }

    if (userStock) {
      await prisma.userStock.update({
        where: { id: userStock.id },
        data: {
          totalCredits: String(userStock.totalCredits + stock.currentPrice * quantity),
          quantity: String(prisma.userStock + quantity)
        }
      });
    } else {
      await prisma.userStock.create({
        data: { quantity: String(quantity), totalCredits: String(stock.currentPrice * quantity), username, stockId }
      });
    }

    await prisma.user.update({
      where: { username },
      data: { credits: String(user.credits - stock.currentPrice * quantity) }
    });

    res.sendStatus(200);
  })
);

router.post(
  "/sell",
  auth,
  wrap(async (req, res) => {
    let { stockId, quantity } = req.body;
    stockId = Number(stockId);

    const username = req.session.user;
    const stock = await getStock(stockId);
    const userStock = await getUserStock(stockId, username);

    if (!userStock) {
      throw { message: "주식을 보유하고 있지 않습니다.", code: 400 };
    }

    if (quantity === "all") {
      quantity = userStock.quantity;
    } else if (quantity === "half") {
      quantity = userStock.quantity / 2n;
    } else {
      quantity = BigInt(quantity);
    }

    const user = await prisma.user.findFirst({ where: { username } });
    user.totalCredits = BigInt(user.totalCredits);
    if (quantity >= userStock.quantity) {
      await prisma.user.update({
        where: { username },
        data: { credits: String(user.totalCredits + userStock.totalCredits) }
      });
      await prisma.userStock.delete({ where: { id: userStock.id } });
    } else {
      await prisma.userStock.update({
        where: { id: userStock.id },
        data: {
          quantity: String(userStock.quantity - quantity),
          totalCredits: String(userStock.totalCredits - stock.currentPrice * quantity)
        }
      });
      await prisma.user.update({
        where: { username },
        data: { credits: String(user.totalCredits + stock.currentPrice * quantity) }
      });
    }

    res.sendStatus(200);
  })
);

export default router;

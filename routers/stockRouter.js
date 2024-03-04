import { Router } from "express";
import prisma from "../prisma/index.js";
import wrap from "../utils/asyncWrapper.js";

const router = Router();

router.use((req, res, next) => {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  next();
});

function getStock(id) {
  return prisma.stock.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      id: true,
      priceHistory: true,
      currentPrice: true
    }
  });
}

function getUserStock(stockId, username) {
  return prisma.userStock.findUnique({
    where: {
      stockId,
      username
    },
    select: {
      id: true,
      quantity: true,
      totalCredits: true
    }
  });
}

router.post(
  "/buy",
  wrap(async (req, res) => {
    const { stockId, quantity } = req.body;
    const username = req.session.user;
    const stock = await getStock(stockId);
    const userStock = await getUserStock(stockId, username);

    if (userStock) {
      await prisma.userStock.update({
        where: {
          id: userStock.id
        },
        data: {
          totalCredits: { increment: stock.currentPrice * quantity },
          quantity: {
            increment: quantity
          }
        }
      });
    } else {
      await prisma.userStock.create({
        data: {
          quantity,
          totalCredits: stock.currentPrice * quantity,
          username,
          stockId
        }
      });
    }

    res.sendStatus(200);
  })
);

router.get(
  "/sell",
  wrap(async (req, res) => {
    const { stockId, quantity } = req.body;
    const username = req.session.user;
    const stock = await getStock(stockId);
    const userStock = await getUserStock(stockId, username);

    if (!userStock) {
      throw { message: "주식을 보유하고 있지 않습니다.", code: 400 };
    }

    if (quantity >= userStock.quantity) {
      await prisma.user.update({
        where: {
          username
        },
        data: {
          credits: {
            increment: userStock.totalCredits
          }
        }
      });
      await prisma.userStock.delete({
        where: {
          id: userStock.id
        }
      });
    } else {
      await prisma.userStock.update({
        where: {
          id: userStock.id
        },
        data: {
          quantity: {
            decrement: quantity
          },
          totalCredits: {
            decrement: stock.currentPrice * quantity
          }
        }
      });
    }

    res.sendStatus(200);
  })
);

export default router;

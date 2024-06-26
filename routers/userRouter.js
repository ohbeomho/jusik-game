import { Router } from "express";
import prisma from "../prisma/index.js";
import wrap from "../utils/asyncWrapper.js";
import bcrypt from "bcrypt";
import config from "../utils/config.js";

const router = Router();

router.get(
  "/",
  wrap(async (req, res) => {
    const { username } = req.query;
    if (!username) {
      throw { message: "사용자명이 주어지지 않았습니다.", code: 401 };
    }

    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        username: true,
        credits: true,
        totalCredits: true,
        creditHistory: true,
        stocks: {
          select: {
            stock: {
              select: {
                id: true,
                name: true
              }
            },
            quantity: true
          }
        }
      }
    });

    user.stocks = user.stocks.map((s) => ({ quantity: s.quantity, stock: s.stock }));

    res.render("user", { user });
  })
);

router
  .route("/signin")
  .get((_, res) => res.render("signin"))
  .post(
    wrap(async (req, res) => {
      const { username, password } = req.body;
      const user = await prisma.user.findFirst({ where: { username }, select: { password: true } });

      if (!user) {
        throw { message: `사용자명이 ${username}인 사용자를 찾을 수 없습니다.`, code: 404 };
      } else if (!(await bcrypt.compare(password, user.password))) {
        throw { message: "비밀번호가 일치하지 않습니다." };
      }

      req.session.user = username;
      req.session.save();

      res.redirect("/");
    })
  );

router
  .route("/signup")
  .get((_, res) => res.render("signup"))
  .post(
    wrap(async (req, res) => {
      const { username, password } = req.body;

      if (await prisma.user.findFirst({ where: { username } })) {
        throw { message: `사용자명이 ${username}인 사용자가 이미 있습니다.` };
      }

      const encryptedPassword = await bcrypt.hash(password, Number(config.SALT_ROUNDS));
      await prisma.user.create({
        data: {
          username,
          password: encryptedPassword
        }
      });

      res.redirect("/user/signin");
    })
  );

router.get(
  "/signout",
  wrap(async (req, res) => {
    if (req.session.user) {
      req.session.destroy();
    }

    res.redirect("/");
  })
);

export default router;

import { Router } from "express";
import prisma from "../prisma/index.js";
import wrap from "../utils/asyncWrapper.js";

const router = Router();

router.get(
  "/:username",
  wrap(async (req, res) => {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        credits: true,
        creditHistory: true,
        stocks: {
          select: {
            stock: {
              select: {
                currentPrice: true
              }
            },
            quantity: true,
            totalCredits: true
          }
        }
      }
    });

    res.render("user", { user });
  })
);

router
  .route("/signin")
  .get((_, res) => res.render("signin"))
  .post(
    wrap(async (req, res) => {
      const { username, password } = req.body;
      const user = await prisma.user.findUnique({ where: { username }, select: { password: true } });

      if (user.password !== password) {
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

      await prisma.user.create({
        data: {
          username,
          password
        }
      });

      res.redirect("/signin");
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

import { Router } from "express";
import wrap from "../utils/asyncWrapper";
import prisma from "../prisma";

const router = Router();

router.get(
  "/:username",
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: {
        name: req.params.username
      }
    });

    res.render("user", { user });
  })
);

// TODO
router.post("/signin");

router.post("/signup");

export default router;

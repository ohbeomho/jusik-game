import prisma from "../prisma/index.js";

async function update() {
  try {
    const top10 = (
      await prisma.user.findMany({
        select: {
          username: true,
          totalCredits: true
        }
      })
    )
      .sort((a, b) => {
        const ac = BigInt(a.totalCredits);
        const bc = BigInt(b.totalCredits);

        if (ac > bc) {
          return -1;
        } else if (ac < bc) {
          return 1;
        } else {
          return 0;
        }
      })
      .slice(0, 10);
    const lastSeasonTop10 = await prisma.lastSeasonTopUser.findMany({
      orderBy: {
        rank: "asc"
      }
    });

    await Promise.all(
      top10.map(({ username, totalCredits: credits }, i) =>
        i < lastSeasonTop10.length
          ? prisma.lastSeasonTopUser.update({
            where: {
              rank: i + 1
            },
            data: {
              username,
              credits
            }
          })
          : prisma.lastSeasonTopUser.create({
            data: {
              rank: i + 1,
              username,
              credits
            }
          })
      )
    );

    if (top10.length < lastSeasonTop10.length) {
      await prisma.lastSeasonTopUser.deleteMany({
        where: {
          rank: {
            gt: top10.length
          }
        }
      });
    }

    await prisma.userStock.deleteMany({});
    await prisma.user.updateMany({
      data: {
        credits: "10000",
        totalCredits: "10000",
        creditHistory: []
      }
    });
  } catch (e) {
    console.error(e);
  }
}

export default update;

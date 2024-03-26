import prisma from "../prisma/index.js";

async function update() {
  try {
    const top10 = await prisma.user.findMany({
      orderBy: {
        totalCredits: "desc"
      },
      select: {
        username: true,
        totalCredits: true
      },
      take: 10
    });
    const lastSeasonTop10 = await prisma.lastSeasonTopUser.findMany({
      orderBy: {
        rank: "asc"
      }
    });

    console.log(top10, lastSeasonTop10);

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

    console.log(await prisma.lastSeasonTopUser.findMany({}));

    await prisma.user.updateMany({
      data: {
        credits: 10000,
        totalCredits: 10000,
        creditHistory: []
      }
    });
    await prisma.userStock.deleteMany({});
  } catch (e) {
    console.error(e);
  }
}

export default update;

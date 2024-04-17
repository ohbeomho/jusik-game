import prisma from "../prisma/index.js";

const MIN_PRICE = 1000;
const MAX_PRICE = 20000;

async function update() {
  try {
    await Promise.all(
      (await prisma.stock.findMany({})).map(async (stock) => {
        const { id, currentPrice, priceHistory } = stock;
        let max = -Infinity;
        let avg =
          priceHistory.length >= 2
            ? Math.abs(
                priceHistory.slice(1).reduce((sum, price, index) => {
                  const change = price - priceHistory[index];

                  if (change > max) {
                    max = change;
                  }

                  return sum + change;
                }, 0) /
                  (priceHistory.length - 1)
              )
            : 1;
        const change = (Math.random() * (Math.random() * 2) - avg / max - currentPrice / MAX_PRICE) * 2000;
        let newPrice = Math.floor(currentPrice + (avg === 0 || max === -Infinity ? 200 : change));

        if (newPrice > MAX_PRICE) {
          newPrice = MAX_PRICE;
        } else if (newPrice < MIN_PRICE) {
          newPrice = MIN_PRICE;
        }

        if (priceHistory.length >= 10) {
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

        await Promise.all(
          (await prisma.userStock.findMany({ where: { stockId: id } })).map((userStock) =>
            prisma.userStock.update({
              where: { id: userStock.id },
              data: {
                totalCredits: String((BigInt(userStock.totalCredits) * BigInt(Math.round((newPrice / currentPrice) * 10000))) / 10000n)
              }
            })
          )
        );
      })
    );

    await Promise.all(
      (
        await prisma.user.findMany({
          include: {
            stocks: {
              select: {
                totalCredits: true
              }
            }
          }
        })
      ).map(async (user) => {
        const { username, stocks, credits, totalCredits, creditHistory } = user;

        if (creditHistory.length >= 10) {
          creditHistory.splice(0, 1);
        }

        creditHistory.push(totalCredits);

        await prisma.user.update({
          where: {
            username
          },
          data: {
            totalCredits: String(BigInt(credits) + stocks.reduce((sum, stock) => sum + BigInt(stock.totalCredits), 0n)),
            creditHistory
          }
        });
      })
    );
  } catch (e) {
    console.error(e);
  }
}

export default update;

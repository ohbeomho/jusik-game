import prisma from "../prisma/index.js";

const MIN_PRICE = 1000;
const MAX_PRICE = 20000;

export async function update() {
  await Promise.all(
    (
      await prisma.stock.findMany({})
    ).map(async (stock) => {
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

      await prisma.userStock.updateMany({
        where: {
          stockId: id
        },
        data: {
          totalCredits: {
            multiply: currentPrice / newPrice
          }
        }
      });
    })
  );

  await Promise.all(
    (
      await prisma.user.findMany({ include: { stocks: true } })
    ).map(async (user) => {
      const { stocks } = user;

      await prisma.user.update({
        where: {
          username: user.username
        },
        data: {
          totalCredits: stocks.reduce((sum, stock) => sum + stock.totalCredits)
        }
      });
    })
  );

  console.log("\n");
}

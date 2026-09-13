const prisma = require("../config/prisma");

const createStore = async ({ name, email, address, ownerId }) => {
  const existingStore = await prisma.store.findFirst({
    where: { email },
  });

  if (existingStore) {
    throw new Error("A store with this email already exists");
  }

  return prisma.store.create({
    data: {
      name,
      email,
      address,
      ownerId: Number(ownerId),
    },
    include: {
      ratings: {
        select: { rating: true },
      },
    },
  });
};

const getDashboard = async (ownerId) => {
  const stores = await prisma.store.findMany({
    where: {
      ownerId,
    },
    include: {
      ratings: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return stores.map((store) => {
    const totalRatings = store.ratings.length;

    const averageRating =
      totalRatings === 0
        ? 0
        : store.ratings.reduce((sum, item) => sum + item.rating, 0) /
          totalRatings;

    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,

      averageRating: Number(averageRating.toFixed(2)),
      totalRatings,

      ratings: store.ratings.map((item) => ({
        id: item.id,
        rating: item.rating,
        createdAt: item.createdAt,
        user: item.user,
      })),
    };
  });
};

module.exports = {
  createStore,
  getDashboard,
};
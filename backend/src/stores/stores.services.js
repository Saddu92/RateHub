const prisma = require("../config/prisma");

// Get all stores
const getStores = async ({
  search,
  name,
  address,
  sortBy = "name",
  sortOrder = "asc",
  page = 1,
  limit = 10,
  userId,
}) => {
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  const searchConditions = [];

  if (search) {
    searchConditions.push(
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        address: {
          contains: search,
          mode: "insensitive",
        },
      }
    );
  }

  if (name) {
    searchConditions.push({
      name: {
        contains: name,
        mode: "insensitive",
      },
    });
  }

  if (address) {
    searchConditions.push({
      address: {
        contains: address,
        mode: "insensitive",
      },
    });
  }

  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }

  const allowedSortFields = [
    "name",
    "address",
    "createdAt",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "name";

  const safeSortOrder = sortOrder === "desc" ? "desc" : "asc";

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,

      skip,
      take: limitNumber,

      orderBy: {
        [safeSortBy]: safeSortOrder,
      },

      include: {
        ratings: {
          select: {
            rating: true,
            userId: true,
          },
        },
      },
    }),

    prisma.store.count({
      where,
    }),
  ]);

  const formattedStores = stores.map((store) => {
    const ratings = store.ratings.map(
      (item) => item.rating
    );

    const totalRatings = ratings.length;

    const overallRating =
      totalRatings > 0
        ? ratings.reduce(
            (sum, rating) => sum + rating,
            0
          ) / totalRatings
        : 0;

    const userRating = userId
      ? store.ratings.find(
          (item) => item.userId === Number(userId)
        )?.rating || null
      : null;

    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      overallRating: Number(
        overallRating.toFixed(2)
      ),
      totalRatings,
      userRating,
      createdAt: store.createdAt,
    };
  });

  return {
    stores: formattedStores,

    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(
        total / limitNumber
      ),
    },
  };
};

// Get one store
const getStoreById = async (storeId, userId) => {
  const store = await prisma.store.findUnique({
    where: {
      id: Number(storeId),
    },

    include: {
      ratings: {
        select: {
          rating: true,
          userId: true,
        },
      },
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const ratings = store.ratings.map(
    (item) => item.rating
  );

  const totalRatings = ratings.length;

  const overallRating =
    totalRatings > 0
      ? ratings.reduce(
          (sum, rating) => sum + rating,
          0
        ) / totalRatings
      : 0;

  const userRating = userId
    ? store.ratings.find(
        (item) => item.userId === Number(userId)
      )?.rating || null
    : null;

  return {
    id: store.id,
    name: store.name,
    email: store.email,
    address: store.address,

    overallRating: Number(
      overallRating.toFixed(2)
    ),

    totalRatings,

    userRating,
  };
};

// Submit rating
const submitRating = async (
  userId,
  storeId,
  rating
) => {
  const store = await prisma.store.findUnique({
    where: {
      id: Number(storeId),
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const existingRating =
    await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId: Number(userId),
          storeId: Number(storeId),
        },
      },
    });

  if (existingRating) {
    throw new Error(
      "You have already rated this store"
    );
  }

  const newRating = await prisma.rating.create({
    data: {
      rating: Number(rating),
      userId: Number(userId),
      storeId: Number(storeId),
    },

    select: {
      id: true,
      rating: true,
      storeId: true,
      userId: true,
      createdAt: true,
    },
  });

  return getStoreById(storeId, userId);
};

// Update rating
const updateRating = async (
  userId,
  storeId,
  rating
) => {
  const existingRating =
    await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId: Number(userId),
          storeId: Number(storeId),
        },
      },
    });

  if (!existingRating) {
    throw new Error(
      "You have not rated this store yet"
    );
  }

  const updatedRating =
    await prisma.rating.update({
      where: {
        userId_storeId: {
          userId: Number(userId),
          storeId: Number(storeId),
        },
      },

      data: {
        rating: Number(rating),
      },

      select: {
        id: true,
        rating: true,
        storeId: true,
        userId: true,
        updatedAt: true,
      },
    });

  return getStoreById(storeId, userId);
};

module.exports = {
  getStores,
  getStoreById,
  submitRating,
  updateRating,
};
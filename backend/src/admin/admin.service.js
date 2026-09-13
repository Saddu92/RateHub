const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// =============================
// Dashboard
// =============================

const getDashboardStats = async () => {
  const [totalUsers, totalStores, totalRatings] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.rating.count(),
  ]);

  return {
    totalUsers,
    totalStores,
    totalRatings,
  };
};

// =============================
// Create User
// =============================

const createUser = async ({
  name,
  email,
  password,
  address,
  role = "USER",
}) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      address,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

const updateUserRole = async (userId, role, actorId) => {
  const allowedRoles = ["ADMIN", "USER", "STORE_OWNER"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  if (Number(userId) === Number(actorId)) {
    throw new Error("You cannot change your own role");
  }

  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

// =============================
// Create Store
// =============================

const createStore = async ({
  name,
  email,
  address,
  ownerId,
}) => {
  const existingStore = await prisma.store.findFirst({
    where: {
      email,
    },
  });

  if (existingStore) {
    throw new Error("A store with this email already exists");
  }

  if (ownerId) {
    const owner = await prisma.user.findUnique({
      where: {
        id: Number(ownerId),
      },
    });

    if (!owner) {
      throw new Error("Store owner not found");
    }

    if (owner.role !== "STORE_OWNER") {
      throw new Error("Selected user is not a store owner");
    }
  }

  const store = await prisma.store.create({
    data: {
      name,
      email,
      address,
      ownerId: ownerId ? Number(ownerId) : null,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return store;
};

// =============================
// Get Stores
// =============================

const getStores = async ({
  search,
  name,
  email,
  address,
  sortBy = "name",
  sortOrder = "asc",
  page = 1,
  limit = 10,
}) => {
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  const conditions = [];

  if (search) {
    conditions.push(
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
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
    conditions.push({
      name: {
        contains: name,
        mode: "insensitive",
      },
    });
  }

  if (email) {
    conditions.push({
      email: {
        contains: email,
        mode: "insensitive",
      },
    });
  }

  if (address) {
    conditions.push({
      address: {
        contains: address,
        mode: "insensitive",
      },
    });
  }

  if (conditions.length > 0) {
    where.OR = conditions;
  }

  const allowedSortFields = ["name", "email", "address", "createdAt"];

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
          },
        },
      },
    }),

    prisma.store.count({
      where,
    }),
  ]);

  const formattedStores = stores.map((store) => {
    const ratings = store.ratings.map((item) => item.rating);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) /
          ratings.length
        : 0;

    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      rating: Number(averageRating.toFixed(2)),
      totalRatings: ratings.length,
      createdAt: store.createdAt,
    };
  });

  return {
    stores: formattedStores,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

// =============================
// Get Users
// =============================

const getUsers = async ({
  search,
  name,
  email,
  address,
  role,
  sortBy = "name",
  sortOrder = "asc",
  page = 1,
  limit = 10,
}) => {
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  const conditions = [];

  if (search) {
    conditions.push(
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
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
    conditions.push({
      name: {
        contains: name,
        mode: "insensitive",
      },
    });
  }

  if (email) {
    conditions.push({
      email: {
        contains: email,
        mode: "insensitive",
      },
    });
  }

  if (address) {
    conditions.push({
      address: {
        contains: address,
        mode: "insensitive",
      },
    });
  }

  if (conditions.length > 0) {
    where.OR = conditions;
  }

  if (role && ["ADMIN", "USER", "STORE_OWNER"].includes(role)) {
    where.role = role;
  }

  const allowedSortFields = [
    "name",
    "email",
    "address",
    "role",
    "createdAt",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "name";

  const safeSortOrder = sortOrder === "desc" ? "desc" : "asc";

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: {
        [safeSortBy]: safeSortOrder,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

// =============================
// Get User Details
// =============================

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },

    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
      createdAt: true,

      stores: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          ratings: {
            select: {
              rating: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    ...user,

    stores: user.stores.map((store) => {
      const ratings = store.ratings.map((item) => item.rating);

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) /
            ratings.length
          : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: Number(averageRating.toFixed(2)),
      };
    }),
  };
};

module.exports = {
  getDashboardStats,
  createUser,
  updateUserRole,
  createStore,
  getUsers,
  getStores,
  getUserById,
};
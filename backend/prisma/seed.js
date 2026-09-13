require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  const password = "Admin@12345";

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@ratehub.com",
    },
    update: {},
    create: {
      name: "RateHub System Administrator",
      email: "admin@ratehub.com",
      password: hashedPassword,
      address: "RateHub Headquarters",
      role: "ADMIN",
    },
  });

  console.log("Admin created:");
  console.log({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
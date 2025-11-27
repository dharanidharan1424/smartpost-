import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a dummy user
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test@test.com",
    },
  });

  console.log("User created:", user);

  // Fetch all users
  const users = await prisma.user.findMany();
  console.log("All users:", users);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

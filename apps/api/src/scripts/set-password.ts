import "dotenv/config"

import{
    hash,
    truncates
} from "bcryptjs"

import { prisma } from "../lib/prisma"

async function main() {
    const email = process.argv[2];
    const password = process.env.NEW_PASSWORD;

    if (!email) {
    throw new Error(
      "Usage: npx tsx src/scripts/set-password.ts <email>",
    );
  }

  if (!password) {
    throw new Error(
      "NEW_PASSWORD environment variable is missing",
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters",
    );
  }

  if (truncates(password)) {
    throw new Error(
      "Password is too long for bcrypt",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
        email,
    }
  });

  if (!user) {
    throw new Error(
      `User not found: ${email}`,
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.update({
    where: {
        id: user.id,
    },

    data: {
        passwordHash,
    },
  });

  console.log(
    `Password configured for ${user.displayName}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
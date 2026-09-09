import "dotenv/config";
import { prisma } from "./lib/prisma.js";

async function main() {
  const sashi = await prisma.user.upsert({
    where: {
      email: "sashi@expense.local",
    },
    update: {},
    create: {
      email: "sashi@expense.local",
      displayName: "Sashi",
    },
  });

  const manoja = await prisma.user.upsert({
    where: {
      email: "manoja@expense.local",
    },
    update: {},
    create: {
      email: "manoja@expense.local",
      displayName: "Manoja",
    },
  });

  let household = await prisma.household.findFirst({
    where: {
      name: "Sashi Household",
    },
  });

  if (!household) {
    household = await prisma.household.create({
      data: {
        name: "Sashi Household",
      },
    });
  }

  await prisma.householdMember.upsert({
    where: {
      householdId_userId: {
        householdId: household.id,
        userId: sashi.id,
      },
    },
    update: {
      role: "owner",
    },
    create: {
      householdId: household.id,
      userId: sashi.id,
      role: "owner",
    },
  });

  await prisma.householdMember.upsert({
    where: {
      householdId_userId: {
        householdId: household.id,
        userId: manoja.id,
      },
    },
    update: {},
    create: {
      householdId: household.id,
      userId: manoja.id,
      role: "member",
    },
  });

  const categories = [
    "Home Loan EMI",
    "Groceries",
    "Outside Food",
    "Medicines",
    "Apartment Maintenance",
    "Electricity",
    "Maids",
    "Broadband & Phone",
    "Transport",
    "Subscriptions",
    "Shopping",
    "Miscellaneous",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: {
        householdId_name: {
          householdId: household.id,
          name,
        },
      },
      update: {},
      create: {
        householdId: household.id,
        name,
      },
    });
  }

  const paymentMethods = [
    "UPI",
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "Cash",
  ];

  for (const name of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: {
        householdId_name: {
          householdId: household.id,
          name,
        },
      },
      update: {},
      create: {
        householdId: household.id,
        name,
      },
    });
  }

  console.log("Seed completed.");
  console.log(`Household ID: ${household.id}`);
  console.log(`Sashi User ID: ${sashi.id}`);
  console.log(`Manoja User ID: ${manoja.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
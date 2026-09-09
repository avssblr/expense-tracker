import { prisma } from "./prisma.js";

export async function isHouseholdMember(
  householdId: number,
  userId: number,
) {
  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
  });

  return membership !== null;
}
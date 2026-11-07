import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Domain helpers for case access, with authorization baked in so route
 * handlers and pages cannot accidentally leak another farmer's data.
 */

export type SessionUser = NonNullable<Session["user"]>;

/** All cases belonging to a single farmer, newest first. */
export async function getCasesForFarmer(farmerId: string) {
  return prisma.case.findMany({
    where: { farmerId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single case only if the given user is allowed to see it:
 * the owning FARMER, or any EXPERT/ADMIN. Returns null if not found or
 * not authorized (callers should treat both as 404 to avoid disclosing
 * the existence of another farmer's case).
 */
export async function getCaseForUser(caseId: string, user: SessionUser) {
  const found = await prisma.case.findUnique({
    where: { id: caseId },
    include: { farmer: { select: { name: true, email: true } } },
  });
  if (!found) return null;

  const isOwner = found.farmerId === user.id;
  const isReviewer = user.role === "EXPERT" || user.role === "ADMIN";
  if (!isOwner && !isReviewer) {
    return null;
  }
  return found;
}

/**
 * Find the crop-scoped Disease knowledge entry matching a case's AI-predicted
 * condition. Mirrors the conservative matching used at screening time so the
 * detail page can show curated management/prevention guidance.
 */
export async function findMatchedDisease(
  cropType: string,
  possibleCondition: string,
) {
  if (!possibleCondition) return null;

  const direct = await prisma.disease.findFirst({
    where: {
      cropType: { equals: cropType },
      name: { contains: possibleCondition },
    },
  });
  if (direct) return direct;

  const candidates = await prisma.disease.findMany({
    where: { cropType: { equals: cropType } },
  });
  const predicted = possibleCondition.toLowerCase();
  return (
    candidates.find(
      (d) =>
        predicted.includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(predicted),
    ) ?? null
  );
}

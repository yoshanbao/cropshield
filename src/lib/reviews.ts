import { prisma } from "@/lib/prisma";

/**
 * Review history helpers with note-visibility rules baked in:
 * internal notes are NEVER included for farmers.
 */

export interface ReviewHistoryItem {
  id: string;
  action: "VERIFIED" | "CORRECTED";
  reviewerName: string;
  correctedCondition: string | null;
  farmerVisibleNote: string | null;
  // Present only when includeInternal is true (expert/admin views).
  internalNote?: string | null;
  createdAt: string;
}

/**
 * Fetch a case's review history, newest first. When includeInternal is false
 * (farmer view), internal notes are stripped entirely.
 */
export async function getReviewHistory(
  caseId: string,
  includeInternal: boolean,
): Promise<ReviewHistoryItem[]> {
  const reviews = await prisma.caseReview.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { name: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    action: r.action,
    reviewerName: r.reviewer?.name ?? "Expert",
    correctedCondition: r.correctedCondition,
    farmerVisibleNote: r.farmerVisibleNote,
    ...(includeInternal ? { internalNote: r.internalNote } : {}),
    createdAt: r.createdAt.toISOString(),
  }));
}

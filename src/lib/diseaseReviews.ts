import { prisma } from "@/lib/prisma";

/**
 * Helpers for the expert disease knowledge-base review workflow.
 */

export interface DiseaseWithReview {
  id: string;
  cropType: string;
  name: string;
  symptoms: string;
  management: string;
  prevention: string;
  sourceTitle: string | null;
  sourceOrg: string | null;
  sourceUrl: string | null;
  needsExpertReview: boolean;
  hasSource: boolean;
  lastReview: {
    decision: "REVIEWED" | "NEEDS_REVISION";
    note: string | null;
    reviewerName: string;
    createdAt: string;
  } | null;
}

/** All diseases with their most recent review (if any), for the expert queue. */
export async function getDiseasesForReview(): Promise<DiseaseWithReview[]> {
  const diseases = await prisma.disease.findMany({
    orderBy: [{ needsExpertReview: "desc" }, { cropType: "asc" }, { name: "asc" }],
    include: {
      diseaseReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { reviewer: { select: { name: true } } },
      },
    },
  });

  return diseases.map((d) => {
    const last = d.diseaseReviews[0];
    return {
      id: d.id,
      cropType: d.cropType,
      name: d.name,
      symptoms: d.symptoms,
      management: d.management,
      prevention: d.prevention,
      sourceTitle: d.sourceTitle,
      sourceOrg: d.sourceOrg,
      sourceUrl: d.sourceUrl,
      needsExpertReview: d.needsExpertReview,
      hasSource: Boolean(d.sourceUrl),
      lastReview: last
        ? {
            decision: last.decision,
            note: last.note,
            reviewerName: last.reviewer?.name ?? "Expert",
            createdAt: last.createdAt.toISOString(),
          }
        : null,
    };
  });
}

/** Full review history for one disease, newest first. */
export async function getDiseaseReviewHistory(diseaseId: string) {
  const reviews = await prisma.diseaseReview.findMany({
    where: { diseaseId },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { name: true } } },
  });
  return reviews.map((r) => ({
    id: r.id,
    decision: r.decision,
    note: r.note,
    reviewerName: r.reviewer?.name ?? "Expert",
    createdAt: r.createdAt.toISOString(),
  }));
}

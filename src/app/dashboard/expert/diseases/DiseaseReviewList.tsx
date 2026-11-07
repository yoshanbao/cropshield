"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  X,
} from "lucide-react";
import type { DiseaseWithReview } from "@/lib/diseaseReviews";

type Decision = "REVIEWED" | "NEEDS_REVISION";

export default function DiseaseReviewList({
  initialDiseases,
}: {
  initialDiseases: DiseaseWithReview[];
}) {
  const [diseases, setDiseases] = useState<DiseaseWithReview[]>(initialDiseases);
  const [active, setActive] = useState<{
    disease: DiseaseWithReview;
    decision: Decision;
  } | null>(null);

  const applyResult = useCallback(
    (id: string, decision: Decision, note: string, reviewerName: string) => {
      setDiseases((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                needsExpertReview: decision !== "REVIEWED",
                lastReview: {
                  decision,
                  note: note || null,
                  reviewerName,
                  createdAt: new Date().toISOString(),
                },
              }
            : d,
        ),
      );
    },
    [],
  );

  if (diseases.length === 0) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-600"
      >
        No disease records found.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {diseases.map((d) => (
          <DiseaseCard
            key={d.id}
            disease={d}
            onReview={(decision) => setActive({ disease: d, decision })}
          />
        ))}
      </div>

      {active && (
        <ReviewModal
          disease={active.disease}
          decision={active.decision}
          onClose={() => setActive(null)}
          onResolved={(id, decision, note, reviewerName) => {
            applyResult(id, decision, note, reviewerName);
            setActive(null);
          }}
        />
      )}
    </>
  );
}

function DiseaseCard({
  disease,
  onReview,
}: {
  disease: DiseaseWithReview;
  onReview: (decision: Decision) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {disease.cropType}
          </span>
          <h2 className="text-lg font-bold text-gray-900">{disease.name}</h2>
        </div>
        <StatusBadge
          needsReview={disease.needsExpertReview}
          decision={disease.lastReview?.decision ?? null}
        />
      </div>

      <div className="space-y-2 text-sm">
        <Field label="Symptoms" text={disease.symptoms} />
        <Field label="Management" text={disease.management} />
        <Field label="Prevention" text={disease.prevention} />
      </div>

      {/* Source */}
      <div className="mt-3">
        {disease.sourceUrl ? (
          <p className="text-xs text-gray-500">
            Source:{" "}
            <a
              href={disease.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {disease.sourceTitle ?? "Reference source"}
              {disease.sourceOrg ? ` — ${disease.sourceOrg}` : ""}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        ) : (
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            No source on record — flagged for review
          </p>
        )}
      </div>

      {/* Last review */}
      {disease.lastReview && (
        <div className="mt-3 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
          <span className="font-semibold">
            {disease.lastReview.decision === "REVIEWED"
              ? "Reviewed"
              : "Needs revision"}
          </span>{" "}
          by {disease.lastReview.reviewerName} ·{" "}
          {new Date(disease.lastReview.createdAt).toLocaleDateString()}
          {disease.lastReview.note && (
            <p className="mt-1 italic">“{disease.lastReview.note}”</p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onReview("REVIEWED")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Mark Reviewed
        </button>
        <button
          type="button"
          onClick={() => onReview("NEEDS_REVISION")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-500 bg-white px-3 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
          Needs Revision
        </button>
      </div>
    </div>
  );
}

function StatusBadge({
  needsReview,
  decision,
}: {
  needsReview: boolean;
  decision: "REVIEWED" | "NEEDS_REVISION" | null;
}) {
  if (!needsReview && decision === "REVIEWED") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        Reviewed
      </span>
    );
  }
  if (decision === "NEEDS_REVISION") {
    return (
      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">
        Needs revision
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
      Awaiting review
    </span>
  );
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}

function ReviewModal({
  disease,
  decision,
  onClose,
  onResolved,
}: {
  disease: DiseaseWithReview;
  decision: Decision;
  onClose: () => void;
  onResolved: (
    id: string,
    decision: Decision,
    note: string,
    reviewerName: string,
  ) => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isRevision = decision === "NEEDS_REVISION";

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || activeEl === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    dialog?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [onClose]);

  const submit = useCallback(async () => {
    setError(null);
    if (isRevision && !note.trim()) {
      setError("A review note is required when requesting a revision.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/diseases/${disease.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to record the review.");
      }
      onResolved(disease.id, decision, note.trim(), "You");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [disease.id, decision, isRevision, note, onResolved]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disease-review-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2
            id="disease-review-title"
            className="flex items-center gap-2 text-base font-bold text-gray-900"
          >
            {isRevision ? (
              <Info className="h-5 w-5 text-amber-600" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            )}
            {isRevision ? "Request Revision" : "Mark as Reviewed"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 rounded-xl bg-gray-50 p-3 text-sm">
            <p className="text-gray-500">{disease.cropType}</p>
            <p className="font-semibold text-gray-900">{disease.name}</p>
          </div>

          <label
            htmlFor="review-note"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Review note{" "}
            {isRevision ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="font-normal text-gray-400">(optional)</span>
            )}
          </label>
          <textarea
            id="review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            autoFocus
            placeholder={
              isRevision
                ? "Explain what needs to be corrected or sourced..."
                : "Optional notes confirming this record..."
            }
            className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            aria-busy={submitting}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isRevision
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : isRevision ? (
              "Submit Revision Request"
            ) : (
              "Confirm Reviewed"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

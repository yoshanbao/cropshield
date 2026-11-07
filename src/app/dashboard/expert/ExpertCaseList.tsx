"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PencilLine,
  ShieldCheck,
  Sprout,
  User,
  X,
} from "lucide-react";

type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ExpertCase {
  id: string;
  cropType: string;
  imageUrl: string;
  confidence: number;
  createdAt: string;
  farmerName: string;
  reportedSymptoms: string;
  ai: {
    possibleCondition: string;
    confidence: number;
    visualObservations: string[];
    urgencyLevel: UrgencyLevel;
  };
}

type Decision = "VERIFIED" | "CORRECTED";

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export default function ExpertCaseList({
  initialCases,
}: {
  initialCases: ExpertCase[];
}) {
  const [cases, setCases] = useState<ExpertCase[]>(initialCases);
  const [active, setActive] = useState<{
    caseItem: ExpertCase;
    decision: Decision;
  } | null>(null);

  const removeCase = useCallback((id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
  }, []);

  if (cases.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center"
      >
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" aria-hidden="true" />
        <p className="text-lg font-semibold text-gray-800">All caught up</p>
        <p className="text-sm text-gray-500">
          There are no pending cases to review right now.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            onVerify={() => setActive({ caseItem, decision: "VERIFIED" })}
            onCorrect={() => setActive({ caseItem, decision: "CORRECTED" })}
          />
        ))}
      </div>

      {active && (
        <ReviewModal
          caseItem={active.caseItem}
          decision={active.decision}
          onClose={() => setActive(null)}
          onResolved={(id) => {
            removeCase(id);
            setActive(null);
          }}
        />
      )}
    </>
  );
}

function CaseCard({
  caseItem,
  onVerify,
  onCorrect,
}: {
  caseItem: ExpertCase;
  onVerify: () => void;
  onCorrect: () => void;
}) {
  const { ai } = caseItem;
  const confidencePct = Math.round(ai.confidence * 100);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Photo */}
      <div className="relative bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={caseItem.imageUrl}
          alt={`${caseItem.cropType} crop submission`}
          className="h-44 w-full object-cover"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
          <Sprout className="h-3.5 w-3.5 text-green-600" />
          {caseItem.cropType}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            URGENCY_STYLES[ai.urgencyLevel]
          }`}
        >
          {ai.urgencyLevel}
        </span>
      </div>

      {/* Side-by-side: farmer symptoms vs AI diagnosis */}
      <div className="grid flex-1 grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <User className="h-3.5 w-3.5" />
            Farmer symptoms
          </p>
          <p className="text-sm leading-relaxed text-gray-700">
            {caseItem.reportedSymptoms || (
              <span className="italic text-gray-400">None reported</span>
            )}
          </p>
        </div>

        <div className="p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Sprout className="h-3.5 w-3.5" />
            AI diagnosis
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {ai.possibleCondition}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {confidencePct}% confidence
          </p>
          {ai.visualObservations.length > 0 && (
            <ul className="mt-2 space-y-1">
              {ai.visualObservations.slice(0, 3).map((obs, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-gray-600"
                >
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-green-500" />
                  {obs}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={onVerify}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <ShieldCheck className="h-4 w-4" />
          Verify Diagnosis
        </button>
        <button
          type="button"
          onClick={onCorrect}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-500 bg-white px-3 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <PencilLine className="h-4 w-4" />
          Correct Diagnosis
        </button>
      </div>
    </div>
  );
}

function ReviewModal({
  caseItem,
  decision,
  onClose,
  onResolved,
}: {
  caseItem: ExpertCase;
  decision: Decision;
  onClose: () => void;
  onResolved: (id: string) => void;
}) {
  const [farmerNote, setFarmerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [correctedCondition, setCorrectedCondition] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isCorrection = decision === "CORRECTED";

  // While open: close on Escape, keep keyboard focus trapped inside the dialog,
  // and restore focus to the element that opened it (the Verify/Correct button)
  // when it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    const getFocusable = (): HTMLElement[] => {
      if (!dialog) return [];
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === dialog);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        // Nothing focusable yet: keep focus on the dialog container.
        e.preventDefault();
        dialog?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first || activeEl === dialog) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    dialog?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      // Restore focus to the opener if it is still in the document.
      if (opener && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [onClose]);

  const submit = useCallback(async () => {
    setError(null);
    if (isCorrection && !farmerNote.trim()) {
      setError("Please add a farmer-visible note to correct this diagnosis.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${caseItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          farmerVisibleNote: farmerNote.trim(),
          internalNote: internalNote.trim(),
          correctedCondition: isCorrection ? correctedCondition.trim() : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to update the case.");
      }
      onResolved(caseItem.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [
    caseItem.id,
    decision,
    isCorrection,
    farmerNote,
    internalNote,
    correctedCondition,
    onResolved,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2
            id="review-modal-title"
            className="flex items-center gap-2 text-base font-bold text-gray-900"
          >
            {isCorrection ? (
              <PencilLine className="h-5 w-5 text-amber-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            )}
            {isCorrection ? "Correct Diagnosis" : "Verify Diagnosis"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="mb-4 rounded-xl bg-gray-50 p-3 text-sm">
            <p className="text-gray-500">
              {caseItem.cropType} · AI diagnosis
            </p>
            <p className="font-semibold text-gray-900">
              {caseItem.ai.possibleCondition}
            </p>
          </div>

          {isCorrection && (
            <div className="mb-4">
              <label
                htmlFor="corrected-condition"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Corrected condition{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="corrected-condition"
                type="text"
                value={correctedCondition}
                onChange={(e) => setCorrectedCondition(e.target.value)}
                placeholder="e.g. Bacterial Leaf Blight"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          )}

          <label
            htmlFor="farmer-note"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Farmer-visible note{" "}
            {isCorrection ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="font-normal text-gray-400">(optional)</span>
            )}
          </label>
          <textarea
            id="farmer-note"
            value={farmerNote}
            onChange={(e) => setFarmerNote(e.target.value)}
            rows={4}
            autoFocus
            placeholder={
              isCorrection
                ? "Explain the correct diagnosis for the farmer..."
                : "Add any confirming notes for the farmer..."
            }
            className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />

          <label
            htmlFor="internal-note"
            className="mb-1.5 mt-4 block text-sm font-medium text-gray-700"
          >
            Internal note{" "}
            <span className="font-normal text-gray-400">
              (experts only, not shown to the farmer)
            </span>
          </label>
          <textarea
            id="internal-note"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            rows={3}
            placeholder="Private notes for other reviewers..."
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

        {/* Footer */}
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
              isCorrection
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : isCorrection ? (
              "Submit Correction"
            ) : (
              "Confirm Verification"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons/ledger-icons";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
}

interface OnboardingChecklistProps {
  storageKey: string;
  title: string;
  subtitle: string;
  items: ChecklistItem[];
}

export function OnboardingChecklist({
  storageKey,
  title,
  subtitle,
  items,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(`zeroplate_checklist_${storageKey}`);
    if (dismissed !== "true") {
      setIsDismissed(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`zeroplate_checklist_${storageKey}`, "true");
  };

  if (!mounted || isDismissed) {
    return null;
  }

  const completedCount = items.filter((i) => i.isCompleted).length;
  const allCompleted = completedCount === items.length;

  return (
    <div className="border border-line bg-[#FAF6EE] p-5 rounded-md text-left transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-basil font-bold">
              Facility Orientation · Ledger Checklist
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-basil/15 text-basil font-semibold">
              {completedCount} of {items.length} Completed
            </span>
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-ink mt-0.5">
            {title}
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>
        </div>

        <button
          onClick={handleDismiss}
          className="text-xs font-mono text-ink-soft hover:text-ink cursor-pointer underline self-start sm:self-auto"
          title="Dismiss orientation checklist"
        >
          Dismiss checklist ×
        </button>
      </div>

      {/* Checklist Items */}
      <div className="divide-y divide-line/60">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="py-2.5 flex items-start sm:items-center justify-between gap-4 text-xs transition-colors hover:bg-black/5 px-2 rounded"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                  item.isCompleted
                    ? "bg-basil text-[#FAF7F2]"
                    : "border border-line bg-ledger-paper text-ink-soft"
                }`}
              >
                {item.isCompleted ? (
                  <CheckIcon size={12} strokeWidth={2} />
                ) : (
                  <span className="font-mono text-[10px]">{idx + 1}</span>
                )}
              </div>
              <div>
                <span
                  className={`font-medium ${
                    item.isCompleted ? "line-through text-ink-soft" : "text-ink"
                  }`}
                >
                  {item.title}
                </span>
                <span className="text-ink-soft text-[11px] block sm:inline sm:ml-2">
                  — {item.description}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              {item.isCompleted ? (
                <span className="text-[11px] font-mono text-basil font-medium">
                  Verified ✓
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[11px] text-basil hover:underline font-medium inline-block"
                >
                  Start →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

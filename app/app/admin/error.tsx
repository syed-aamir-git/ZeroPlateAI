"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Portal Error Caught by Boundary:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-[#3D2538] border border-[#5A3653] text-center space-y-5 shadow-lg text-[#F3EEE2]">
      <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/80 mx-auto flex items-center justify-center text-red-400">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#F3EEE2]">
          Administrative Portal Notice
        </h2>
        <p className="text-xs text-[#C9B9C7] leading-relaxed max-w-md mx-auto">
          A temporary error occurred while rendering this administrative section. Your credentials and session remain active.
        </p>
      </div>

      {error?.message && (
        <div className="p-3 rounded-lg bg-black/30 border border-[#5A3653] text-[11px] font-mono-numeral text-red-300 text-left overflow-x-auto">
          {error.message}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9A441] hover:bg-[#D9A441]/90 text-[#24211C] text-xs font-mono-numeral font-bold transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Section</span>
        </button>

        <Link
          href="/app/admin/overview"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#5A3653] bg-[#4A2E44] hover:bg-[#4A2E44]/80 text-[#F3EEE2] text-xs font-mono-numeral font-semibold transition-all cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-[#C9B9C7]" />
          <span>Admin Overview</span>
        </Link>
      </div>
    </div>
  );
}

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
    <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-5 shadow-xs text-zinc-900">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center text-rose-600">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl font-bold text-zinc-900">
          Admin Portal Notice
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
          A temporary error occurred while rendering this administrative section. Your credentials and session remain active.
        </p>
      </div>

      {error?.message && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-rose-700 text-left overflow-x-auto">
          {error.message}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Section</span>
        </button>

        <Link
          href="/app/admin/overview"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-zinc-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-zinc-400" />
          <span>Admin Overview</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon } from "@/components/icons/ledger-icons";
import { CheckCircle2, ShieldAlert, Sliders, AlertCircle } from "lucide-react";

interface SafetyRulesConfig {
  _id?: string;
  cookedFoodMaxHours: number;
  cookedFoodWindowCutoffHours: number;
  dairyBufferHours: number;
  expiryWindowThresholdHours: {
    cooked_food: number;
    dairy: number;
    bakery: number;
    raw_produce: number;
    packaged: number;
  };
  updatedAt?: string;
}

const LIMITS = {
  cookedFoodMaxHours: { min: 0, max: 72, label: "Cooked Food Max Age" },
  cookedFoodWindowCutoffHours: { min: 0, max: 72, label: "Pickup Window Cutoff" },
  dairyBufferHours: { min: 0, max: 72, label: "Dairy Buffer Window" },
  cooked_food: { min: 0, max: 72, label: "Cooked Food" },
  dairy: { min: 0, max: 168, label: "Dairy" },
  bakery: { min: 0, max: 168, label: "Bakery" },
  raw_produce: { min: 0, max: 336, label: "Produce" },
  packaged: { min: 0, max: 720, label: "Packaged" },
} as const;

function getValidationError(value: string, min: number, max: number): string | null {
  if (value.trim() === "") return "Value cannot be empty";
  const num = Number(value);
  if (isNaN(num)) return "Must be a valid number";
  if (num < min) return `Cannot be less than ${min}h`;
  if (num > max) return `Invalid: Exceeds max limit (${max}h)`;
  return null;
}

export default function AdminSafetyRulesPage() {
  const [config, setConfig] = React.useState<SafetyRulesConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [cookedFoodMaxHours, setCookedFoodMaxHours] = React.useState("4");
  const [cookedFoodWindowCutoffHours, setCookedFoodWindowCutoffHours] = React.useState("4");
  const [dairyBufferHours, setDairyBufferHours] = React.useState("2");
  const [expiryThresholds, setExpiryThresholds] = React.useState({
    cooked_food: "2",
    dairy: "12",
    bakery: "12",
    raw_produce: "24",
    packaged: "48",
  });

  // Real-time validations
  const errors = React.useMemo(() => {
    return {
      cookedFoodMaxHours: getValidationError(cookedFoodMaxHours, LIMITS.cookedFoodMaxHours.min, LIMITS.cookedFoodMaxHours.max),
      cookedFoodWindowCutoffHours: getValidationError(cookedFoodWindowCutoffHours, LIMITS.cookedFoodWindowCutoffHours.min, LIMITS.cookedFoodWindowCutoffHours.max),
      dairyBufferHours: getValidationError(dairyBufferHours, LIMITS.dairyBufferHours.min, LIMITS.dairyBufferHours.max),
      cooked_food: getValidationError(expiryThresholds.cooked_food, LIMITS.cooked_food.min, LIMITS.cooked_food.max),
      dairy: getValidationError(expiryThresholds.dairy, LIMITS.dairy.min, LIMITS.dairy.max),
      bakery: getValidationError(expiryThresholds.bakery, LIMITS.bakery.min, LIMITS.bakery.max),
      raw_produce: getValidationError(expiryThresholds.raw_produce, LIMITS.raw_produce.min, LIMITS.raw_produce.max),
      packaged: getValidationError(expiryThresholds.packaged, LIMITS.packaged.min, LIMITS.packaged.max),
    };
  }, [cookedFoodMaxHours, cookedFoodWindowCutoffHours, dairyBufferHours, expiryThresholds]);

  const isFormInvalid = Object.values(errors).some((err) => err !== null);

  const fetchRules = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/safety-rules");
      const json = await res.json();
      if (res.ok && json.rules) {
        setConfig(json.rules);
        setCookedFoodMaxHours(String(json.rules.cookedFoodMaxHours ?? 4));
        setCookedFoodWindowCutoffHours(String(json.rules.cookedFoodWindowCutoffHours ?? 4));
        setDairyBufferHours(String(json.rules.dairyBufferHours ?? 2));
        if (json.rules.expiryWindowThresholdHours) {
          setExpiryThresholds({
            cooked_food: String(json.rules.expiryWindowThresholdHours.cooked_food ?? 2),
            dairy: String(json.rules.expiryWindowThresholdHours.dairy ?? 12),
            bakery: String(json.rules.expiryWindowThresholdHours.bakery ?? 12),
            raw_produce: String(json.rules.expiryWindowThresholdHours.raw_produce ?? 24),
            packaged: String(json.rules.expiryWindowThresholdHours.packaged ?? 48),
          });
        }
      }
    } catch (err) {
      console.error("Failed to load safety rules config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormInvalid) {
      setMessage({ type: "error", text: "Please correct invalid fields exceeding allowed limits before saving." });
      return;
    }
    setSaving(true);
    setMessage(null);

    const numCooked = Number(cookedFoodMaxHours);
    const numCutoff = Number(cookedFoodWindowCutoffHours);
    const numDairy = Number(dairyBufferHours);

    const cf = Number(expiryThresholds.cooked_food);
    const dy = Number(expiryThresholds.dairy);
    const bk = Number(expiryThresholds.bakery);
    const rp = Number(expiryThresholds.raw_produce);
    const pk = Number(expiryThresholds.packaged);

    try {
      const res = await fetch("/api/v1/admin/safety-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookedFoodMaxHours: numCooked,
          cookedFoodWindowCutoffHours: numCutoff,
          dairyBufferHours: numDairy,
          expiryWindowThresholdHours: {
            cooked_food: cf,
            dairy: dy,
            bakery: bk,
            raw_produce: rp,
            packaged: pk,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Failed to update safety rules." });
        return;
      }

      setConfig(json.rules);
      setMessage({
        type: "success",
        text: "Safety rules updated and immediately active across server-side gating engines.",
      });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error saving rules." });
    } finally {
      setSaving(false);
    }
  };

  const getInputClasses = (hasError: boolean) =>
    `w-full px-3 py-2 text-xs rounded-xl font-medium outline-none transition-all shadow-xs ${
      hasError
        ? "bg-rose-50/70 border border-rose-400 text-rose-900 ring-2 ring-rose-400/30 focus:border-rose-500 focus:ring-rose-500/20"
        : "bg-slate-50/70 border border-slate-200 text-zinc-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
    }`;

  const getCategoryInputClasses = (hasError: boolean) =>
    `w-full px-2.5 py-2 text-xs rounded-xl font-medium outline-none transition-all shadow-xs ${
      hasError
        ? "bg-rose-50/70 border border-rose-400 text-rose-900 ring-2 ring-rose-400/30 focus:border-rose-500 focus:ring-rose-500/20"
        : "bg-slate-50/70 border border-slate-200 text-zinc-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
    }`;

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs max-w-4xl mx-auto">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
        <div className="text-xs text-zinc-500">
          Loading food safety rules configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Automated Gating Engine
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            Food Safety Rules Config
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure safety thresholds, maximum shelf life, and automated rejection gating parameters.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium shadow-xs flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Regulatory Context Notice */}
      <div className="border border-slate-200/90 bg-white p-5 rounded-2xl text-xs text-zinc-600 space-y-2 shadow-xs">
        <div className="flex items-center gap-2 font-semibold text-zinc-900 uppercase text-[11px] tracking-wider">
          <ShieldCheckIcon size={16} className="text-emerald-600" />
          <span>FSSAI Standards Compliance &amp; Fail-Closed Safety</span>
        </div>
        <p className="leading-relaxed">
          These thresholds govern the server-side safety gating engine. Any surplus food listing that exceeds these safety limits is automatically rejected and archived in the audit logs for strict food safety compliance.
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="border border-slate-200/90 bg-white rounded-2xl p-6 space-y-6 text-xs shadow-xs">
        <div className="border-b border-slate-200/80 pb-3">
          <h2 className="font-display text-base font-bold text-zinc-900">
            Core Temperature &amp; Elapsed Time Limits
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Governs maximum elapsed time since food was prepared, cooked, or packaged.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Cooked Food Max Age (Hours) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="72"
              value={cookedFoodMaxHours}
              onChange={(e) => setCookedFoodMaxHours(e.target.value)}
              aria-invalid={!!errors.cookedFoodMaxHours}
              required
              className={getInputClasses(!!errors.cookedFoodMaxHours)}
            />
            {errors.cookedFoodMaxHours ? (
              <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.cookedFoodMaxHours}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Standard: 4 hours (Allowed: 0h – 72h)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pickup Window Cutoff (Hours) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="72"
              value={cookedFoodWindowCutoffHours}
              onChange={(e) => setCookedFoodWindowCutoffHours(e.target.value)}
              aria-invalid={!!errors.cookedFoodWindowCutoffHours}
              required
              className={getInputClasses(!!errors.cookedFoodWindowCutoffHours)}
            />
            {errors.cookedFoodWindowCutoffHours ? (
              <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.cookedFoodWindowCutoffHours}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Pickup must finish within window (Allowed: 0h – 72h)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Dairy Buffer Window (Hours) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="72"
              value={dairyBufferHours}
              onChange={(e) => setDairyBufferHours(e.target.value)}
              aria-invalid={!!errors.dairyBufferHours}
              required
              className={getInputClasses(!!errors.dairyBufferHours)}
            />
            {errors.dairyBufferHours ? (
              <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.dairyBufferHours}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Minimum time before expiry (Allowed: 0h – 72h)
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-slate-200/80 pb-3 pt-3">
          <h2 className="font-display text-base font-bold text-zinc-900">
            Category &quot;Nearing Expiry&quot; Warning Thresholds
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            Hours before shelf-life estimate at which items automatically trigger the &quot;Nearing Expiry&quot; badge.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Cooked Food (h)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="72"
              value={expiryThresholds.cooked_food}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, cooked_food: e.target.value })}
              aria-invalid={!!errors.cooked_food}
              required
              className={getCategoryInputClasses(!!errors.cooked_food)}
            />
            {errors.cooked_food ? (
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.cooked_food}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 block mt-1">
                Allowed: 0h – 72h
              </span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Dairy (h)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="168"
              value={expiryThresholds.dairy}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, dairy: e.target.value })}
              aria-invalid={!!errors.dairy}
              required
              className={getCategoryInputClasses(!!errors.dairy)}
            />
            {errors.dairy ? (
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.dairy}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 block mt-1">
                Allowed: 0h – 168h
              </span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Bakery (h)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="168"
              value={expiryThresholds.bakery}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, bakery: e.target.value })}
              aria-invalid={!!errors.bakery}
              required
              className={getCategoryInputClasses(!!errors.bakery)}
            />
            {errors.bakery ? (
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.bakery}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 block mt-1">
                Allowed: 0h – 168h
              </span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Produce (h)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="336"
              value={expiryThresholds.raw_produce}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, raw_produce: e.target.value })}
              aria-invalid={!!errors.raw_produce}
              required
              className={getCategoryInputClasses(!!errors.raw_produce)}
            />
            {errors.raw_produce ? (
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.raw_produce}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 block mt-1">
                Allowed: 0h – 336h
              </span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Packaged (h)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="720"
              value={expiryThresholds.packaged}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, packaged: e.target.value })}
              aria-invalid={!!errors.packaged}
              required
              className={getCategoryInputClasses(!!errors.packaged)}
            />
            {errors.packaged ? (
              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.packaged}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 block mt-1">
                Allowed: 0h – 720h
              </span>
            )}
          </div>
        </div>

        {config?.updatedAt && (
          <div className="text-xs text-zinc-400 pt-3 border-t border-slate-200/80">
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {isFormInvalid ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>One or more values exceed allowed limits (0h – max). Fix errors to save.</span>
            </div>
          ) : (
            <div />
          )}
          <Button
            type="submit"
            disabled={saving || isFormInvalid}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {saving ? "Saving Configuration..." : "Save Gating Rules"}
          </Button>
        </div>
      </form>
    </div>
  );
}

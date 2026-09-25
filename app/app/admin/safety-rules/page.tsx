"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, SettingsIcon } from "@/components/icons/ledger-icons";
import { CheckCircle2, ShieldAlert, Sliders, Info } from "lucide-react";

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
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/admin/safety-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookedFoodMaxHours: Number(cookedFoodMaxHours),
          cookedFoodWindowCutoffHours: Number(cookedFoodWindowCutoffHours),
          dairyBufferHours: Number(dairyBufferHours),
          expiryWindowThresholdHours: {
            cooked_food: Number(expiryThresholds.cooked_food),
            dairy: Number(expiryThresholds.dairy),
            bakery: Number(expiryThresholds.bakery),
            raw_produce: Number(expiryThresholds.raw_produce),
            packaged: Number(expiryThresholds.packaged),
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
              value={cookedFoodMaxHours}
              onChange={(e) => setCookedFoodMaxHours(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
            <span className="text-[11px] text-zinc-400 block mt-1">
              Standard: 4 hours
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pickup Window Cutoff (Hours) *
            </label>
            <input
              type="number"
              step="any"
              value={cookedFoodWindowCutoffHours}
              onChange={(e) => setCookedFoodWindowCutoffHours(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
            <span className="text-[11px] text-zinc-400 block mt-1">
              Pickup must finish within window
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Dairy Buffer Window (Hours) *
            </label>
            <input
              type="number"
              step="any"
              value={dairyBufferHours}
              onChange={(e) => setDairyBufferHours(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
            <span className="text-[11px] text-zinc-400 block mt-1">
              Minimum time before expiry
            </span>
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
              value={expiryThresholds.cooked_food}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, cooked_food: e.target.value })}
              required
              className="w-full px-2.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Dairy (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.dairy}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, dairy: e.target.value })}
              required
              className="w-full px-2.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Bakery (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.bakery}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, bakery: e.target.value })}
              required
              className="w-full px-2.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Produce (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.raw_produce}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, raw_produce: e.target.value })}
              required
              className="w-full px-2.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
              Packaged (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.packaged}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, packaged: e.target.value })}
              required
              className="w-full px-2.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-zinc-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all shadow-xs"
            />
          </div>
        </div>

        {config?.updatedAt && (
          <div className="text-xs text-zinc-400 pt-3 border-t border-slate-200/80">
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {saving ? "Saving Configuration..." : "Save Gating Rules"}
          </Button>
        </div>
      </form>
    </div>
  );
}

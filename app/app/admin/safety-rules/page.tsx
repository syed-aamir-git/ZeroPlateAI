"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon, SettingsIcon } from "@/components/icons/ledger-icons";

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
      <div className="p-12 text-center text-xs font-mono-numeral text-[#C9B9C7]">
        Loading active FSSAI safety rules configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441]">
            Automated Gating Engine (Functional PRD Section 12.3)
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            Food Safety Gating Thresholds
          </h1>
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-[6px] border text-xs font-medium ${
            message.type === "success"
              ? "bg-[#2F4B3A]/30 border-[#2F4B3A] text-[#86C29B]"
              : "bg-clay-rust/30 border-clay-rust text-[#F4A88E]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Regulatory Context Notice */}
      <div className="border border-[#5A3653] bg-[#3D2538] p-4 rounded-[6px] text-xs text-[#D4CBBF] space-y-2">
        <div className="flex items-center gap-2 font-semibold text-[#F3EEE2] uppercase font-mono-numeral">
          <ShieldCheckIcon size={16} />
          <span>FSSAI Norms Compliance & Fail-Closed Enforcement</span>
        </div>
        <p className="leading-relaxed">
          These thresholds govern the server-side safety engine (<code className="text-[#D9A441] font-mono-numeral">evaluateSafetyGating</code>).
          Any surplus listing that exceeds these thresholds is automatically rejected with an HTTP 422 response and
          logged to MongoDB <code className="text-[#D9A441] font-mono-numeral">auditLogs</code> for strict liability traceability.
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="border border-[#5A3653] bg-[#3D2538] rounded-[6px] p-6 space-y-6 text-xs">
        <div className="border-b border-[#5A3653] pb-3">
          <h2 className="font-display text-lg font-bold text-[#F3EEE2]">
            Core Temperature & Elapsed Time Thresholds
          </h2>
          <p className="text-[#C9B9C7] text-[11px] mt-0.5">
            Governs maximum elapsed time since food was cooked or packaged.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono-numeral uppercase text-[#C9B9C7] mb-1">
              Cooked Food Max Age (Hours) *
            </label>
            <input
              type="number"
              step="any"
              value={cookedFoodMaxHours}
              onChange={(e) => setCookedFoodMaxHours(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] font-mono-numeral focus:border-[#D9A441] outline-none"
            />
            <span className="text-[10px] text-[#9E8A9A] font-mono-numeral block mt-1">
              FSSAI Standard: 4 hours
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono-numeral uppercase text-[#C9B9C7] mb-1">
              Pickup Window Max Cutoff (Hours) *
            </label>
            <input
              type="number"
              step="any"
              value={cookedFoodWindowCutoffHours}
              onChange={(e) => setCookedFoodWindowCutoffHours(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] font-mono-numeral focus:border-[#D9A441] outline-none"
            />
            <span className="text-[10px] text-[#9E8A9A] font-mono-numeral block mt-1">
              Pickup close $\le$ cooked + X hrs
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono-numeral uppercase text-[#C9B9C7] mb-1">
              Dairy Expiry Buffer (Hours) *
            </label>
            <input
              type="number"
              step="any"
              value={dairyBufferHours}
              onChange={(e) => setDairyBufferHours(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] font-mono-numeral focus:border-[#D9A441] outline-none"
            />
            <span className="text-[10px] text-[#9E8A9A] font-mono-numeral block mt-1">
              Min time before dairy expiry
            </span>
          </div>
        </div>

        <div className="border-b border-[#5A3653] pb-3 pt-3">
          <h2 className="font-display text-lg font-bold text-[#F3EEE2]">
            Category "Nearing Expiry" Auto-Flag Thresholds
          </h2>
          <p className="text-[#C9B9C7] text-[11px] mt-0.5">
            Hours before shelf-life estimate at which items automatically trigger the "Nearing Expiry" flag in kitchen ledgers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-numeral">
          <div>
            <label className="block text-[10px] uppercase text-[#C9B9C7] mb-1">
              Cooked Food (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.cooked_food}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, cooked_food: e.target.value })}
              required
              className="w-full px-2.5 py-1.5 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#C9B9C7] mb-1">
              Dairy (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.dairy}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, dairy: e.target.value })}
              required
              className="w-full px-2.5 py-1.5 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#C9B9C7] mb-1">
              Bakery (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.bakery}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, bakery: e.target.value })}
              required
              className="w-full px-2.5 py-1.5 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#C9B9C7] mb-1">
              Produce (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.raw_produce}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, raw_produce: e.target.value })}
              required
              className="w-full px-2.5 py-1.5 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#C9B9C7] mb-1">
              Packaged (h)
            </label>
            <input
              type="number"
              value={expiryThresholds.packaged}
              onChange={(e) => setExpiryThresholds({ ...expiryThresholds, packaged: e.target.value })}
              required
              className="w-full px-2.5 py-1.5 text-xs bg-[#241621] border border-[#5A3653] rounded-[4px] text-[#F3EEE2] focus:border-[#D9A441] outline-none"
            />
          </div>
        </div>

        {config?.updatedAt && (
          <div className="text-[11px] text-[#9E8A9A] font-mono-numeral pt-2 border-t border-[#5A3653]">
            Last configured in MongoDB: {new Date(config.updatedAt).toLocaleString()}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#D9A441] hover:bg-[#E2B359] text-[#24211C] font-bold text-xs"
          >
            {saving ? "Saving Configuration..." : "Save Gating Rules to Database"}
          </Button>
        </div>
      </form>
    </div>
  );
}

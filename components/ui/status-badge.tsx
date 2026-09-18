import * as React from "react";
import { cn } from "@/lib/utils";
import { StampIcon } from "@/components/icons/ledger-icons";

export type StatusVariant =
  | "verified_safe"
  | "delivered"
  | "confirmed"
  | "pending"
  | "forecasted"
  | "in_transit"
  | "nearing_expiry"
  | "action_needed"
  | "rejected"
  | "blocked"
  | "expired"
  | "premium"
  | "admin"
  | "in_stock";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  status?: string;
  label?: string;
  showIcon?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  verified_safe: "bg-[#2F4B3A]/10 text-[#2F4B3A] border-[#2F4B3A]/30",
  delivered: "bg-[#2F4B3A]/10 text-[#2F4B3A] border-[#2F4B3A]/30",
  confirmed: "bg-[#2F4B3A]/10 text-[#2F4B3A] border-[#2F4B3A]/30",
  in_stock: "bg-[#2F4B3A]/10 text-[#2F4B3A] border-[#2F4B3A]/30",
  pending: "bg-[#D9A441]/15 text-[#7E570A] border-[#D9A441]/40",
  forecasted: "bg-[#D9A441]/15 text-[#7E570A] border-[#D9A441]/40",
  in_transit: "bg-[#D9A441]/15 text-[#7E570A] border-[#D9A441]/40",
  nearing_expiry: "bg-[#B85C38]/12 text-[#9A4625] border-[#B85C38]/30",
  action_needed: "bg-[#B85C38]/12 text-[#9A4625] border-[#B85C38]/30",
  rejected: "bg-[#8A4331]/12 text-[#8A4331] border-[#8A4331]/30",
  blocked: "bg-[#8A4331]/12 text-[#8A4331] border-[#8A4331]/30",
  expired: "bg-[#8A4331]/12 text-[#8A4331] border-[#8A4331]/30",
  premium: "bg-[#4A2E44]/12 text-[#4A2E44] border-[#4A2E44]/30",
  admin: "bg-[#4A2E44]/12 text-[#4A2E44] border-[#4A2E44]/30",
};

const defaultLabels: Record<StatusVariant, string> = {
  verified_safe: "Verified Safe",
  delivered: "Delivered",
  confirmed: "Confirmed",
  in_stock: "In Stock",
  pending: "Pending Match",
  forecasted: "Forecasted",
  in_transit: "In Transit",
  nearing_expiry: "Nearing Expiry",
  action_needed: "Action Needed",
  rejected: "Rejected",
  blocked: "Blocked",
  expired: "Expired",
  premium: "Premium",
  admin: "Admin",
};

export function StatusBadge({
  variant,
  status,
  label,
  showIcon = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const effectiveVariant: StatusVariant = (
    (status || variant || "verified_safe") in variantStyles
      ? (status || variant || "verified_safe")
      : "pending"
  ) as StatusVariant;

  const displayLabel = children || label || defaultLabels[effectiveVariant];
  const isVerified =
    effectiveVariant === "verified_safe" ||
    effectiveVariant === "delivered" ||
    effectiveVariant === "confirmed" ||
    effectiveVariant === "in_stock";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider",
        variantStyles[effectiveVariant],
        className
      )}
      {...props}
    >
      {showIcon && isVerified && <StampIcon size={12} strokeWidth={2} />}
      {displayLabel}
    </span>
  );
}

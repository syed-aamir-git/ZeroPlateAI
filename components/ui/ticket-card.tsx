import * as React from "react";
import { cn } from "@/lib/utils";

interface TicketCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hasNotch?: boolean;
}

export function TicketCard({
  children,
  className,
  hasNotch = true,
  ...props
}: TicketCardProps) {
  return (
    <div
      className={cn(
        "relative bg-[#FAF6EE] text-ink border border-line p-5 shadow-none transition-colors",
        hasNotch && "ticket-notch",
        className
      )}
      {...props}
    >
      {/* Decorative hairline corner notch indicator if needed */}
      {children}
    </div>
  );
}

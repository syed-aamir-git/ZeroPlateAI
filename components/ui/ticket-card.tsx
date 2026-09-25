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
        "relative bg-white text-slate-900 border border-slate-200/90 rounded-xl p-4.5 shadow-xs transition-all hover:shadow-md",
        hasNotch && "ticket-notch",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}


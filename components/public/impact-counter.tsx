"use client";

import * as React from "react";

interface ImpactCounterProps {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function ImpactCounter({
  value,
  suffix = "",
  decimals = 0,
  className = "",
}: ImpactCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    // If user prefers reduced motion or value is 0, render immediately
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      value === 0 ||
      hasAnimatedRef.current
    ) {
      setDisplayValue(value);
      return;
    }

    hasAnimatedRef.current = true;
    const duration = 400; // 400ms per Design PRD Section 7
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quadratic ease out
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const current = easeProgress * value;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span className={`font-ledger-mono ${className}`}>
      {formatted}
      {suffix}
    </span>
  );
}

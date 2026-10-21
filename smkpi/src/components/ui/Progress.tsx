"use client";

import { useEffect, useState } from "react";
import { cn, clamp } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  color,
  height = "h-2",
  showLabel = false,
  animate = true,
}: {
  value: number;
  className?: string;
  color?: string;
  height?: string;
  showLabel?: boolean;
  animate?: boolean;
}) {
  const pct = clamp(value);
  const [width, setWidth] = useState(animate ? 0 : pct);

  useEffect(() => {
    if (!animate) {
      setWidth(pct);
      return;
    }
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct, animate]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn("relative w-full overflow-hidden rounded-pill bg-ink/10", height)}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: color ?? "linear-gradient(90deg, var(--iris), var(--iris-tint))",
          }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular text-ink-soft">
          {Math.round(pct)}%
        </span>
      ) : null}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color,
  trackColor = "var(--ink-soft)",
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const pct = clamp(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeOpacity={0.12}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ?? "url(#ring-gradient)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--iris)" />
            <stop offset="100%" stopColor="var(--iris-tint)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

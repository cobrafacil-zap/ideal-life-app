import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
  className?: string;
  height?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  max,
  colorClass = "bg-ember-gradient",
  className,
  height = "md",
  label,
  showValue,
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const completed = value >= max;

  const heights: Record<NonNullable<ProgressBarProps["height"]>, string> = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-[12px] text-ink-soft">
          {label && <span className="font-medium">{label}</span>}
          {showValue && (
            <span className="font-mono">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-pill bg-line/60 overflow-hidden",
          heights[height]
        )}
        role="progressbar"
        aria-valuenow={Math.min(value, max)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-pill transition-all duration-500 ease-out",
            colorClass,
            completed && "shadow-[0_0_0_2px_rgba(47,107,79,0.15)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

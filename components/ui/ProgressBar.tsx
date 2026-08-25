import { clsx } from "clsx";

export function ProgressBar({
  value,
  max,
  colorClass = "bg-ember",
  className,
}: {
  value: number;
  max: number;
  colorClass?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={clsx("h-2.5 w-full rounded-pill bg-line/60 overflow-hidden", className)}>
      <div
        className={clsx("h-full rounded-pill transition-all duration-500 ease-out", colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

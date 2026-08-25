import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accent = "ember",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  progress?: { current: number; max: number };
  accent?: "ember" | "moss";
}) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon
          size={16}
          className={clsx(accent === "ember" ? "text-ember" : "text-moss")}
        />
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      </div>
      <p className="font-mono text-lg font-semibold leading-none">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-ink-faint">{sub}</p>}
      {progress && (
        <ProgressBar
          value={progress.current}
          max={progress.max}
          colorClass={accent === "ember" ? "bg-ember" : "bg-moss"}
          className="mt-3"
        />
      )}
    </div>
  );
}

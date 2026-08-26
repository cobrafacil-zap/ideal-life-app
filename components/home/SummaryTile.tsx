import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface SummaryTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  progress?: { current: number; max: number };
  accent?: "ember" | "moss";
  onClick?: () => void;
}

export function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accent = "ember",
  onClick,
}: SummaryTileProps) {
  const interactive = typeof onClick === "function";
  const Component: React.ElementType = interactive ? "button" : "div";

  return (
    <Component
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl border border-line/60 bg-surface p-4 transition-all duration-200",
        "hover:border-ember/40 hover:shadow-floating",
        interactive &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base active:scale-[0.99]"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg",
            accent === "ember" ? "bg-ember-soft" : "bg-moss-soft"
          )}
        >
          <Icon
            size={15}
            className={cn(accent === "ember" ? "text-ember" : "text-moss-dark")}
            strokeWidth={2.2}
          />
        </span>
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      </div>
      <p className="font-mono text-lg font-semibold leading-none text-ink">
        {value}
      </p>
      {sub && (
        <p className="mt-1 line-clamp-2 text-[12px] text-ink-faint">{sub}</p>
      )}
      {progress && (
        <ProgressBar
          value={progress.current}
          max={progress.max}
          colorClass={accent === "ember" ? "bg-ember-gradient" : "bg-moss"}
          className="mt-3"
        />
      )}
    </Component>
  );
}

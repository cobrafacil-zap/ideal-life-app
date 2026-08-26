import { cn } from "@/lib/cn";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export type SummaryAccent = "ember" | "moss" | "gold" | "rose" | "lilac";
export type SummaryVariant = "default" | "compact" | "feature";

export interface SummaryTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  progress?: { current: number; max: number };
  accent?: SummaryAccent;
  variant?: SummaryVariant;
  /** Quando informado, renderiza como <Link> em vez de <div>/<button>. */
  href?: string;
  onClick?: () => void;
}

/** Mapas de classes para cada accent. Tokens já existem em tailwind.config.ts. */
const accentIconBg: Record<SummaryAccent, string> = {
  ember: "bg-ember-soft",
  moss: "bg-moss-soft",
  gold: "bg-gold-soft",
  rose: "bg-rose-soft",
  lilac: "bg-lilac-soft",
};

const accentIconText: Record<SummaryAccent, string> = {
  ember: "text-ember",
  moss: "text-moss-dark",
  gold: "text-gold-dark",
  rose: "text-rose-dark",
  lilac: "text-lilac-dark",
};

const accentProgress: Record<SummaryAccent, string> = {
  ember: "bg-ember-gradient",
  moss: "bg-moss-gradient",
  gold: "bg-gold-gradient",
  rose: "bg-rose-gradient",
  lilac: "bg-lilac-gradient",
};

export function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accent = "ember",
  variant = "default",
  href,
  onClick,
}: SummaryTileProps) {
  const interactive = typeof onClick === "function" || Boolean(href);
  const Component: React.ElementType = href ? Link : interactive ? "button" : "div";

  // Variants controlam densidade visual.
  const variantClasses = (() => {
    switch (variant) {
      case "compact":
        return {
          wrapper: "p-3",
          chip: "h-6 w-6 rounded-md",
          iconSize: 13,
          label: "text-[11px]",
          value: "font-mono text-base",
        };
      case "feature":
        return {
          wrapper: "p-5",
          chip: "h-10 w-10 rounded-xl",
          iconSize: 18,
          label: "text-[12px]",
          value: "font-display text-2xl",
        };
      default:
        return {
          wrapper: "p-4",
          chip: "h-7 w-7 rounded-lg",
          iconSize: 15,
          label: "text-[13px]",
          value: "font-mono text-lg",
        };
    }
  })();

  const sharedClass = cn(
    "group block w-full text-left rounded-2xl border border-line/40 bg-surface transition-all duration-200",
    "hover:border-ember/40 hover:shadow-floating",
    variantClasses.wrapper,
    interactive &&
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base active:scale-[0.99]",
  );

  const linkProps = href
    ? {
        href,
        // Link não aceita type/onClick, mas spread funciona.
      }
    : {};

  return (
    <Component
      type={!href && interactive ? "button" : undefined}
      onClick={!href ? onClick : undefined}
      {...linkProps}
      className={sharedClass}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center justify-center",
            accentIconBg[accent],
            variantClasses.chip,
          )}
        >
          <Icon
            size={variantClasses.iconSize}
            className={accentIconText[accent]}
            strokeWidth={2.2}
          />
        </span>
        <span className={cn("font-medium text-ink-soft", variantClasses.label)}>
          {label}
        </span>
      </div>
      <p className={cn("font-semibold leading-none text-ink", variantClasses.value)}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 line-clamp-2 text-[12px] text-ink-faint">{sub}</p>
      )}
      {progress && (
        <ProgressBar
          value={progress.current}
          max={progress.max}
          colorClass={accentProgress[accent]}
          className="mt-3"
        />
      )}
    </Component>
  );
}

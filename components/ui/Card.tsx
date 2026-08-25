import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "bg-surface rounded-card shadow-card border border-line/60",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

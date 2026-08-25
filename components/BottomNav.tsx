"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Sun, HeartPulse, Utensils, Droplets, CircleUserRound } from "lucide-react";

const items = [
  { href: "/hoje", label: "Hoje", icon: Sun },
  { href: "/saude", label: "Saúde", icon: HeartPulse },
  { href: "/alimentacao", label: "Alimentação", icon: Utensils },
  { href: "/ciclo", label: "Ciclo", icon: Droplets },
  { href: "/perfil", label: "Perfil", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur border-t border-line">
      <div className="mx-auto max-w-md grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]"
            >
              <Icon
                size={22}
                strokeWidth={2.2}
                className={clsx(active ? "text-ember" : "text-ink-faint")}
              />
              <span className={clsx(active ? "text-ember font-medium" : "text-ink-faint")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* respiro para a safe area do iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-surface/90" />
    </nav>
  );
}

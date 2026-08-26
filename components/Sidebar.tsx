"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-config";
import { cn } from "@/lib/cn";

/**
 * Sidebar de navegação no desktop.
 * Fica sticky à esquerda a partir de md, e o conteúdo principal
 * ganha padding compensatório (ver `app/(app)/layout.tsx`).
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-64 md:border-r md:border-line md:bg-surface/70 md:backdrop-blur"
      aria-label="Navegação lateral"
    >
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <div className="h-10 w-10 rounded-2xl bg-ember-gradient shadow-floating" aria-hidden="true" />
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight">Vitta</p>
          <p className="text-[12px] text-ink-soft">Sua vida, organizada.</p>
        </div>
      </div>

      <nav className="flex-1 px-3" aria-label="Seções do app">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, description }) => {
            const active = pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                    active
                      ? "bg-ember-soft text-ember-dark"
                      : "text-ink-soft hover:bg-line/40 hover:text-ink"
                  )}
                >
                  <Icon
                    size={18}
                    strokeWidth={2.2}
                    className={cn(
                      "mt-0.5 shrink-0",
                      active ? "text-ember" : "text-ink-faint"
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold leading-none">{label}</span>
                    <span className="mt-0.5 block text-[12px] text-ink-faint">
                      {description}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-line">
        <p className="text-[11px] text-ink-faint">
          Vitta · Construído com Supabase + Next.js
        </p>
      </div>
    </aside>
  );
}

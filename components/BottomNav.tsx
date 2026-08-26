"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-config";

/**
 * Navegação inferior fixa no mobile.
 * Em desktop (>= md) ela é escondida — a navegação passa a ser
 * uma sidebar lateral fixa (ver `app/(app)/layout.tsx`).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface/85 backdrop-blur border-t border-line"
    >
      <ul className="mx-auto grid max-w-[1200px] grid-cols-5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors",
                  "focus-visible:outline-none focus-visible:bg-line/30",
                  active ? "text-ember" : "text-ink-faint"
                )}
              >
                <Icon size={22} strokeWidth={2.2} aria-hidden="true" />
                <span className={cn(active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* respiro para a safe area do iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-surface/85" />
    </nav>
  );
}

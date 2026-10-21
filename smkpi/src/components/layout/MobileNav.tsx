"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { navItems, isActivePath } from "./nav-config";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { GoalFormModal } from "@/components/goals/GoalFormModal";

const MOBILE_ITEMS = ["/", "/metas", "/habitos", "/evolucao", "/conquistas"];

export function MobileNav() {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {MOBILE_ITEMS.slice(0, 2).map((href) => {
            const item = navItems.find((n) => n.href === href)!;
            const active = isActivePath(pathname, href);
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-iris" : "text-ink-faint",
                )}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.8} />
                {item.shortLabel}
              </Link>
            );
          })}

          <button
            onClick={() => setFormOpen(true)}
            className="flex flex-col items-center justify-center -mt-6"
            aria-label="Nova meta"
          >
            <span className="grid h-13 w-13 place-items-center rounded-2xl bg-iris-gradient p-3.5 text-white shadow-float ring-4 ring-base">
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-ink-faint">Nova</span>
          </button>

          {MOBILE_ITEMS.slice(2, 4).map((href) => {
            const item = navItems.find((n) => n.href === href)!;
            const active = isActivePath(pathname, href);
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-iris" : "text-ink-faint",
                )}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.8} />
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}

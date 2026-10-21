"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Repeat2,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
}

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Início",
    icon: LayoutDashboard,
    description: "Visão geral de tudo que você está perseguindo",
  },
  {
    href: "/metas",
    label: "Minhas Metas",
    shortLabel: "Metas",
    icon: Target,
    description: "Cadastre, edite e acompanhe cada objetivo",
  },
  {
    href: "/habitos",
    label: "Hábitos",
    shortLabel: "Hábitos",
    icon: Repeat2,
    description: "Rotinas que sustentam suas metas",
  },
  {
    href: "/calendario",
    label: "Calendário",
    shortLabel: "Agenda",
    icon: CalendarDays,
    description: "Prazos, etapas e compromissos",
  },
  {
    href: "/evolucao",
    label: "Minha Evolução",
    shortLabel: "Evolução",
    icon: TrendingUp,
    description: "O que você já conquistou",
  },
  {
    href: "/ano",
    label: "Meu Ano",
    shortLabel: "Ano",
    icon: CalendarRange,
    description: "Visão panorâmica de 2026",
  },
  {
    href: "/sonhos",
    label: "Meus Sonhos",
    shortLabel: "Sonhos",
    icon: Sparkles,
    description: "Objetivos maiores, sem prazo",
  },
  {
    href: "/conquistas",
    label: "Conquistas",
    shortLabel: "Conquistas",
    icon: Trophy,
    description: "Seus marcos e medalhas",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    shortLabel: "Ajustes",
    icon: Settings,
    description: "Conta, dados e preferências",
  },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200",
              active
                ? "bg-iris-soft text-iris-dark"
                : "text-ink-soft hover:bg-ink/5 hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-iris" : "text-ink-faint group-hover:text-ink-soft",
              )}
              strokeWidth={1.9}
            />
            <span className="truncate">{item.label}</span>
            {active ? (
              <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-iris" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

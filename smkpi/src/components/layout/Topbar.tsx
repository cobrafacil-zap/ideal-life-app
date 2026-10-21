"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  Monitor,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useStore } from "@/lib/data/store";
import { buildGoalViews, buildNotices } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import { GoalFormModal } from "@/components/goals/GoalFormModal";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "O que você quer conquistar e o quanto já avançou" },
  "/metas": { title: "Minhas Metas", subtitle: "Todos os seus objetivos em um só lugar" },
  "/habitos": { title: "Hábitos", subtitle: "As rotinas que movem suas metas" },
  "/calendario": { title: "Calendário", subtitle: "Prazos, etapas e compromissos" },
  "/evolucao": { title: "Minha Evolução", subtitle: "Tudo o que você já conquistou" },
  "/ano": { title: "Meu Ano", subtitle: "A visão panorâmica do seu ano" },
  "/sonhos": { title: "Meus Sonhos", subtitle: "Objetivos maiores, sem prazo definido" },
  "/conquistas": { title: "Conquistas", subtitle: "Seus marcos e medalhas" },
  "/configuracoes": { title: "Configurações", subtitle: "Conta, dados e preferências" },
};

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { state, updateSettings, user, mode, signOut } = useStore();
  const [search, setSearch] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [openBell, setOpenBell] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const meta =
    Object.entries(TITLES).find(([key]) =>
      key === "/" ? pathname === "/" : pathname.startsWith(key),
    )?.[1] ?? TITLES["/"];

  const views = buildGoalViews(state);
  const notices = buildNotices(state, views);
  const results = search.trim()
    ? views
        .filter((v) =>
          v.goal.title.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setOpenSearch(false);
      if (bellRef.current && !bellRef.current.contains(target)) setOpenBell(false);
      if (userRef.current && !userRef.current.contains(target)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const current = state.settings.theme;
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateSettings({ theme: next });
  };

  const ThemeIcon =
    state.settings.theme === "light"
      ? Sun
      : state.settings.theme === "dark"
        ? Moon
        : Monitor;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 lg:px-8">
        <button
          onClick={onOpenMenu}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-ink/5 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-ink lg:text-xl">
            {meta.title}
          </h1>
          <p className="hidden truncate text-[12px] text-ink-faint sm:block">{meta.subtitle}</p>
        </div>

        {/* busca */}
        <div ref={searchRef} className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenSearch(true);
            }}
            onFocus={() => setOpenSearch(true)}
            placeholder="Buscar meta…"
            className="h-10 w-56 rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-all focus:w-64 focus:border-iris focus:outline-none focus:ring-4 focus:ring-iris/10"
          />
          {openSearch && results.length > 0 ? (
            <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-card border border-line bg-surface shadow-float animate-scale-in">
              {results.map((v) => (
                <button
                  key={v.goal.id}
                  onClick={() => {
                    router.push(`/metas/${v.goal.id}`);
                    setOpenSearch(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/5"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ background: `${v.category?.color ?? "#4F46E5"}1a`, color: v.category?.color }}
                  >
                    <Icon name={v.goal.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{v.goal.title}</span>
                    <span className="block text-[11px] text-ink-faint">
                      {v.category?.name} · {Math.round(v.breakdown.total)}%
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* tema */}
        <button
          onClick={cycleTheme}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-ink/5"
          aria-label="Alternar tema"
          title={`Tema: ${state.settings.theme}`}
        >
          <ThemeIcon className="h-[18px] w-[18px]" />
        </button>

        {/* notificações */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setOpenBell((v) => !v)}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-ink/5"
            aria-label="Lembretes"
          >
            <Bell className="h-[18px] w-[18px]" />
            {notices.length ? (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-bold text-white">
                {notices.length}
              </span>
            ) : null}
          </button>
          {openBell ? (
            <div className="absolute right-0 top-12 w-[320px] overflow-hidden rounded-card border border-line bg-surface shadow-float animate-scale-in">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-display text-sm font-semibold text-ink">Lembretes</p>
                <span className="text-[11px] font-semibold text-ink-faint">{notices.length} itens</span>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notices.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
                    Tudo em dia por aqui. 🎉
                  </p>
                ) : (
                  notices.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setOpenBell(false)}
                      className="flex gap-3 border-b border-line/70 px-4 py-3 transition-colors last:border-0 hover:bg-ink/[0.03]"
                    >
                      <span
                        className={cn(
                          "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                          n.tone === "danger" && "bg-rose",
                          n.tone === "warning" && "bg-amber",
                          n.tone === "success" && "bg-jade",
                          n.tone === "info" && "bg-iris",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-snug text-ink">
                          {n.title}
                        </span>
                        <span className="block truncate text-[12px] text-ink-faint">
                          {n.description}
                        </span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* conta */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setOpenUser((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-iris-soft text-[13px] font-bold text-iris-dark transition-colors hover:bg-iris/15"
            aria-label="Conta"
          >
            {(state.settings.displayName || user?.email || "V").charAt(0).toUpperCase()}
          </button>
          {openUser ? (
            <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-card border border-line bg-surface shadow-float animate-scale-in">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {state.settings.displayName || "Visitante"}
                </p>
                <p className="truncate text-[11px] text-ink-faint">
                  {mode === "cloud" ? user?.email : "Demonstração local"}
                </p>
              </div>
              <Link
                href="/configuracoes"
                onClick={() => setOpenUser(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-ink/5"
              >
                <LogIn className="h-3.5 w-3.5" /> Conectar conta
              </Link>
              {user ? (
                <button
                  onClick={async () => {
                    setOpenUser(false);
                    await signOut();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-ink/5"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <Button
          size="sm"
          className="hidden sm:inline-flex"
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() => setFormOpen(true)}
        >
          Nova meta
        </Button>
      </div>

      {false ? <Loader2 /> : null}

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </header>
  );
}

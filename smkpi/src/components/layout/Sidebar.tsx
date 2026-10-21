"use client";

import Link from "next/link";
import { useState } from "react";
import { Cloud, CloudOff, Plus, X } from "lucide-react";
import { NavLinks } from "./nav-config";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/data/store";
import { GoalFormModal } from "@/components/goals/GoalFormModal";

export function Sidebar() {
  const { mode, user } = useStore();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-surface/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-iris-gradient text-white shadow-card">
            <span className="font-display text-[15px] font-bold">S</span>
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-bold tracking-tight text-ink">SMKPI</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Metas & progresso
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Button fullWidth leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
            Nova meta
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks />
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-ink-faint">
            {mode === "cloud" ? (
              <>
                <Cloud className="h-3.5 w-3.5 text-jade" />
                <span className="truncate">Sincronizado · {user?.email ?? "conta"}</span>
              </>
            ) : (
              <>
                <CloudOff className="h-3.5 w-3.5" />
                <span>Modo demonstração (local)</span>
              </>
            )}
          </div>
          <Link
            href="/configuracoes"
            className="mt-2 block text-[11px] font-semibold text-iris hover:underline"
          >
            Conectar uma conta →
          </Link>
        </div>
      </aside>

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[280px] animate-fade-in flex-col border-r border-line bg-surface shadow-float">
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-iris-gradient text-white">
              <span className="font-display text-[15px] font-bold">S</span>
            </span>
            <p className="font-display text-[15px] font-bold text-ink">SMKPI</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-faint hover:bg-ink/5"
            aria-label="Fechar menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <Button
            fullWidth
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setFormOpen(true);
              onClose();
            }}
          >
            Nova meta
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <NavLinks onNavigate={onClose} />
        </div>
      </div>
      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme, type Theme } from "./ThemeProvider";

interface Option {
  id: "light" | "dark" | "system";
  label: string;
  icon: typeof Sun;
}

const OPTIONS: Option[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "system", label: "Automático", icon: Monitor },
];

/**
 * 3 botões grandes (claro / escuro / automático). Persiste em localStorage
 * via ThemeProvider. `resolved` é só para feedback visual quando está em
 * "Automático" (não muda nada na escolha do usuário).
 */
export function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="grid grid-cols-3 gap-2"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        // Mostra qual modo automático resolveu, sem sobrescrever a escolha.
        const autoHint = id === "system" && mode === "system" ? ` (${resolved === "dark" ? "escuro" : "claro"})` : "";
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 text-[12px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
              active
                ? "bg-ember-soft text-ember-dark shadow-card ring-1 ring-ember/30"
                : "bg-line/40 text-ink-soft hover:bg-line/60",
            )}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="font-semibold">
              {label}
              {autoHint && (
                <span className="font-normal text-ink-faint">{autoHint}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { Theme };
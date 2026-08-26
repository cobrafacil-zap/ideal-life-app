"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "vitta-theme";

interface ThemeContextValue {
  /** Tema ativo segundo a app. "system" significa seguir prefers-color-scheme. */
  mode: "light" | "dark" | "system";
  /** Tema efetivo que está aplicado no <html> (resolve "system"). */
  resolved: Theme;
  setMode: (mode: "light" | "dark" | "system") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): "light" | "dark" | "system" {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch (_) {
    /* localStorage indisponível — segue system */
  }
  return "system";
}

function resolveTheme(mode: "light" | "dark" | "system"): Theme {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // O anti-flash no <head> já definiu data-theme antes da hidratação; aqui só
  // sincronizamos o estado para o que o usuário vê e para os toggles funcionarem.
  const [mode, setModeState] = useState<"light" | "dark" | "system">("system");
  const [resolved, setResolved] = useState<Theme>("light");

  useEffect(() => {
    const stored = readStoredMode();
    setModeState(stored);
    const r = resolveTheme(stored);
    setResolved(r);
    applyTheme(r);

    // Reagir a mudanças do SO enquanto o modo for "system".
    if (stored === "system" && typeof window !== "undefined") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (e: MediaQueryListEvent) => {
        const next: Theme = e.matches ? "dark" : "light";
        setResolved(next);
        applyTheme(next);
      };
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  const setMode = useCallback((next: "light" | "dark" | "system") => {
    setModeState(next);
    if (next === "system") {
      try {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } catch (_) { /* ignore */ }
    } else {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (_) { /* ignore */ }
    }
    const r = resolveTheme(next);
    setResolved(r);
    applyTheme(r);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Sem provider — devolve defaults no SSR / fora do ThemeProvider.
    return {
      mode: "system",
      resolved: "light",
      setMode: () => { /* no-op */ },
    };
  }
  return ctx;
}
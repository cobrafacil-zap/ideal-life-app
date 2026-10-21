import type { AppState } from "@/lib/types";
import { buildSeedState } from "@/lib/seed";

const KEY = "smkpi:state:v1";
const FLAG_KEY = "smkpi:seeded:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadLocalState(): AppState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.goals)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalState(state: AppState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / modo privado — a app segue funcionando em memória */
  }
}

export function clearLocalState(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(FLAG_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSeeded(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSeeded(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(FLAG_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Estado inicial: dados de demonstração (sempre presentes na 1ª abertura). */
export function getInitialState(): AppState {
  return loadLocalState() ?? buildSeedState();
}

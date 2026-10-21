"use client";

import { useEffect, useState } from "react";

export type ThemeName = "light" | "dark";

/**
 * Paleta dos gráficos.
 *
 * Motivo: atributos SVG (`fill="var(--x)"`) não resolvem custom properties
 * em todos os navegadores — por isso os gráficos usam hexadecimais por tema.
 */
export const CHART_COLORS: Record<
  ThemeName,
  {
    iris: string;
    irisTint: string;
    jade: string;
    amber: string;
    rose: string;
    grid: string;
    axis: string;
    surface: string;
    ink: string;
    inkSoft: string;
  }
> = {
  light: {
    iris: "#4F46E5",
    irisTint: "#7C74F0",
    jade: "#0E9F6E",
    amber: "#D97706",
    rose: "#E11D48",
    grid: "#E8E8EF",
    axis: "#8B8C9C",
    surface: "#FFFFFF",
    ink: "#0F1017",
    inkSoft: "#5A5B6B",
  },
  dark: {
    iris: "#8B85F5",
    irisTint: "#6C64E8",
    jade: "#34D399",
    amber: "#FBBF24",
    rose: "#FB7185",
    grid: "#23232E",
    axis: "#74758A",
    surface: "#111117",
    ink: "#F4F4F7",
    inkSoft: "#A9AABA",
  },
};

/** Tema ativo do documento (reage a mudanças em tempo real). */
export function useChartTheme(): ThemeName {
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    const read = () => {
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

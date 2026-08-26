import type { Config } from "tailwindcss";

const config: Config = {
  // Trocar o tema adicionando a classe `dark` no <html>. Combinado com
  // os tokens de globals.css, isso vira o esquema inteiro.
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Superfícies
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        // Texto
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          faint: "var(--ink-faint)",
        },
        // Bordas
        line: "var(--line)",
        // Acentos
        ember: {
          DEFAULT: "var(--ember)",
          soft: "var(--ember-soft)",
          dark: "var(--ember-dark)",
          tint: "var(--ember-tint)",
        },
        moss: {
          DEFAULT: "var(--moss)",
          soft: "var(--moss-soft)",
          dark: "var(--moss-dark)",
          tint: "var(--moss-tint)",
        },
        // Tons do ciclo menstrual (PHASE_META)
        rose: {
          DEFAULT: "var(--rose)",
          soft: "var(--rose-soft)",
          dark: "var(--rose)",
        },
        lilac: {
          DEFAULT: "var(--lilac)",
          soft: "var(--lilac-soft)",
          dark: "var(--lilac)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          soft: "var(--gold-soft)",
          dark: "var(--gold)",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "1.5rem",
        pill: "999px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        floating: "var(--shadow-floating)",
        inset: "inset 0 1px 2px rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        "ember-gradient":
          "linear-gradient(135deg, var(--ember) 0%, var(--ember-tint) 100%)",
        "moss-gradient":
          "linear-gradient(135deg, var(--moss) 0%, var(--moss-tint) 100%)",
        "rose-gradient":
          "linear-gradient(135deg, var(--rose) 0%, color-mix(in srgb, var(--rose) 55%, var(--ember-soft)) 100%)",
        "lilac-gradient":
          "linear-gradient(135deg, var(--lilac) 0%, color-mix(in srgb, var(--lilac) 55%, var(--lilac-soft)) 100%)",
        "gold-gradient":
          "linear-gradient(135deg, var(--gold) 0%, color-mix(in srgb, var(--gold) 50%, var(--gold-soft)) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "ring-fill": {
          "0%": { strokeDashoffset: "var(--ring-start)" },
          "100%": { strokeDashoffset: "var(--ring-end)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "ring-fill": "ring-fill 0.9s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
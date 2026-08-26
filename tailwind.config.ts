import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#FAFAF8",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#161C1A",
          soft: "#4B5550",
          faint: "#8A9490",
        },
        ember: {
          DEFAULT: "#FF6A39",
          soft: "#FFE4D9",
          dark: "#E6501F",
        },
        moss: {
          DEFAULT: "#2F6B4F",
          soft: "#DCEBE2",
          dark: "#204B37",
        },
        line: "#E7E2D8",
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
        card: "0 1px 2px rgba(22,28,26,0.04), 0 8px 24px -12px rgba(22,28,26,0.10)",
        floating: "0 12px 32px -8px rgba(22,28,26,0.18)",
        inset: "inset 0 1px 2px rgba(22,28,26,0.06)",
      },
      backgroundImage: {
        "ember-gradient": "linear-gradient(135deg, #FF6A39 0%, #FF8F5C 100%)",
        "moss-gradient": "linear-gradient(135deg, #2F6B4F 0%, #3F8863 100%)",
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

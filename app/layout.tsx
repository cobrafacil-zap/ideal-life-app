import type { Metadata, Viewport } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://vitta.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vitta — Sua vida, organizada com clareza",
    template: "%s · Vitta",
  },
  description:
    "Vitta é o seu app pessoal de saúde física, alimentação, ciclo menstrual e rotina — em um só lugar, sem ruído.",
  applicationName: "Vitta",
  keywords: [
    "saúde",
    "alimentação",
    "ciclo menstrual",
    "treino",
    "rotina",
    "bem-estar",
    "hábitos",
  ],
  authors: [{ name: "Vitta" }],
  creator: "Vitta",
  category: "health",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Vitta",
    title: "Vitta — Sua vida, organizada com clareza",
    description:
      "Registre humor, água, refeições, treinos, peso e ciclo menstrual em um só lugar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitta — Sua vida, organizada com clareza",
    description:
      "Registre humor, água, refeições, treinos, peso e ciclo menstrual em um só lugar.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#FAFAF8" },
  ],
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body className="font-body bg-base text-ink antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

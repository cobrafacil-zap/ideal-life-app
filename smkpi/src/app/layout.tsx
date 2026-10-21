import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { DataProvider } from "@/lib/data/store";
import { ToastProvider } from "@/components/ui/Toast";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SMKPI — Metas, progresso e evolução",
    template: "%s · SMKPI",
  },
  description:
    "SMKPI é o seu app para acompanhar metas pessoais e profissionais: prazos, progresso, hábitos, conquistas e evolução — tudo em um só lugar.",
  applicationName: "SMKPI",
  keywords: ["metas", "goals", "progresso", "hábitos", "produtividade", "okr"],
  authors: [{ name: "SMKPI" }],
  icons: { icon: ["/favicon.svg"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F6F8" },
    { media: "(prefers-color-scheme: dark)", color: "#09090D" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('smkpi:theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (sysDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-base font-body text-ink antialiased">
        <DataProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </DataProvider>
      </body>
    </html>
  );
}

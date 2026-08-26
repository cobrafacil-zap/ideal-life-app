import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";

/**
 * Layout autenticado.
 *
 * - Mobile (<md): conteúdo em container estreito, BottomNav fixa no rodapé.
 * - Desktop (≥md): sidebar fixa à esquerda e conteúdo em duas colunas
 *   (resumo à esquerda, detalhe à direita), com respiro para safe area.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      <Sidebar />

      {/* Conteúdo principal: deslocado à direita no desktop para acomodar a sidebar */}
      <div className="md:pl-64">
        <main className="pb-28 md:pb-12">
          <div className="app-container py-6 md:py-10 animate-fade-up">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

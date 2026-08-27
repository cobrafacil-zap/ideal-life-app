"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function NovoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("/treinos/meus-treinos/novo error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 pt-6">
      <div className="rounded-card border border-ember/30 bg-ember-soft/40 p-4 sm:p-5">
        <p className="font-display text-base font-bold text-ember-dark">
          Não foi possível criar o treino
        </p>
        <p className="mt-2 text-[12px] text-ink-soft">
          {error.message || "(mensagem vazia)"}
        </p>
        {error.digest && (
          <p className="mt-1 text-[10px] text-ink-faint">
            digest: <code>{error.digest}</code>
          </p>
        )}
        <Button onClick={reset} variant="primary" className="mt-4" fullWidth>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
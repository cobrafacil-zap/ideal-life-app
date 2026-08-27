"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export default function TreinosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("/treinos error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 pt-6">
      <Card>
        <CardHeader
          title="Não foi possível carregar"
          description="Ocorreu um erro ao renderizar esta página."
        />
        <div className="space-y-3">
          <p className="rounded-2xl bg-ember-soft px-3 py-2 text-[12px] text-ember-dark">
            <strong>Mensagem:</strong> {error.message || "(vazia)"}
          </p>
          {error.digest && (
            <p className="text-[11px] text-ink-faint">
              Digest: <code>{error.digest}</code>
            </p>
          )}
          <Button onClick={reset} variant="primary" fullWidth>
            Tentar novamente
          </Button>
        </div>
      </Card>
    </div>
  );
}
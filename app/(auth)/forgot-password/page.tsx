"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);

    if (error) {
      setError("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setSent(true);
  }

  return (
    <Card>
      <header className="mb-5">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Recuperar senha
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Informe seu e-mail para receber o link de redefinição.
        </p>
      </header>

      {sent ? (
        <div className="flex flex-col items-center text-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-moss-soft text-moss-dark">
            <Check size={22} aria-hidden="true" />
          </span>
          <p className="text-[15px] text-ink">
            Se houver uma conta com o e-mail <strong>{email}</strong>, enviamos
            um link para redefinir sua senha. Confira sua caixa de entrada (e o
            spam, por via das dúvidas).
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            error={error ?? undefined}
          />
          <Button
            type="submit"
            loading={loading}
            fullWidth
            leadingIcon={<KeyRound size={16} />}
          >
            Enviar link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link
          href="/login"
          className="font-semibold text-ember-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded px-1"
        >
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}

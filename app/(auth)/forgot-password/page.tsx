"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);
    setSent(true);
  }

  return (
    <Card>
      {sent ? (
        <p className="text-center text-[15px] text-ink">
          Se houver uma conta com o e-mail <strong>{email}</strong>, enviamos um link para
          redefinir sua senha.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-ink-soft">
            Informe seu e-mail para receber o link de redefinição de senha.
          </p>
          <TextField
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={loading} className="w-full">
            Enviar link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/login" className="text-ember-dark font-semibold">
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}

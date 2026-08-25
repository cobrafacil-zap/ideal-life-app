"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/hoje`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Não foi possível criar sua conta. Tente novamente.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <p className="text-center text-[15px] text-ink">
          Enviamos um e-mail de confirmação para <strong>{email}</strong>. Confirme para
          ativar sua conta e começar a usar o Vitta.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-ember-dark">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/login" className="text-ember-dark font-semibold">
          Entrar
        </Link>
      </p>
    </Card>
  );
}

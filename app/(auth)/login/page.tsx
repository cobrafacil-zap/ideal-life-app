"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    router.push("/hoje");
    router.refresh();
  }

  return (
    <Card>
      <header className="mb-5">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Entrar
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Acesse sua conta para continuar.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && (
          <p className="text-sm text-ember-dark" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-moss-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded px-1"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          loading={loading}
          fullWidth
          leadingIcon={<LogIn size={16} />}
        >
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Ainda não tem conta?{" "}
        <Link
          href="/signup"
          className="font-semibold text-ember-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded px-1"
        >
          Criar conta
        </Link>
      </p>
    </Card>
  );
}

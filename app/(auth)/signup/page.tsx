"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UserPlus, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
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

    if (password.length < 8) {
      setLoading(false);
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    // Validação rápida de env no browser (evita "Failed to fetch" opaco)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      setError("Configuração do Supabase ausente (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY). Configure em Vercel → Settings → Environment Variables.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/hoje`,
        },
      });

      setLoading(false);

      if (error) {
        console.error("[signup] supabase error:", error);
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists")) {
          setError("Este e-mail já está cadastrado. Tente fazer login.");
        } else if (msg.includes("database error saving new user")) {
          setError(
            "Erro ao salvar perfil (gatilho do banco). Rode a migration 20260924_fix_handle_new_user.sql no SQL Editor do Supabase e tente novamente. Detalhe: " +
              error.message
          );
        } else if (msg.includes("failed to fetch") || msg.includes("fetch") || msg.includes("network")) {
          setError(
            "Falha de rede ao conectar no Supabase (Failed to fetch). Causas comuns: projeto Supabase pausado/excluído, NEXT_PUBLIC_SUPABASE_URL errado no Vercel, ou bloqueio de rede. Verifique Vercel → Settings → Environment Variables e Supabase Dashboard → Project Health. Detalhe: " +
              error.message
          );
        } else if (msg.includes("email rate limit") || msg.includes("too many requests")) {
          setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        } else if (msg.includes("signups not allowed") || msg.includes("signup is disabled")) {
          setError("Cadastros desabilitados neste projeto Supabase. Ative em Authentication → Providers → Email.");
        } else {
          setError(error.message || "Não foi possível criar sua conta. Tente novamente.");
        }
        return;
      }

      // Supabase pode retornar user sem session quando o e-mail já existe
      // mas ainda não foi confirmado — trate como "já cadastrado"
      if (data.user && !data.session && !data.user.email_confirmed_at && data.user.identities?.length === 0) {
        setError("Este e-mail já está cadastrado. Verifique sua caixa de entrada ou tente fazer login.");
        return;
      }

      if (data.session) {
        router.push("/hoje");
        router.refresh();
        return;
      }

      setSent(true);
    } catch (err: any) {
      setLoading(false);
      console.error("[signup] unexpected error:", err);
      const msg = (err?.message || String(err) || "").toLowerCase();
      if (msg.includes("failed to fetch")) {
        setError(
          "Falha de rede (Failed to fetch). O navegador não conseguiu falar com o Supabase. Verifique se NEXT_PUBLIC_SUPABASE_URL está correto no Vercel e se o projeto Supabase não está pausado. Tente em aba anônima sem adblock."
        );
      } else {
        setError(err?.message || "Erro inesperado. Tente novamente.");
      }
    }
  }

  if (sent) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-moss-soft text-moss-dark">
            <Check size={22} aria-hidden="true" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">
            Confirme seu e-mail
          </h2>
          <p className="text-[15px] text-ink-soft">
            Enviamos um link de confirmação para{" "}
            <strong className="text-ink">{email}</strong>. Abra o e-mail para
            ativar sua conta e começar a usar o Vitta.
          </p>
        </div>
      </Card>
    );
  }

  const passwordStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  return (
    <Card>
      <header className="mb-5">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Criar conta
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Comece a organizar sua vida hoje. Leva menos de 1 minuto.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como podemos te chamar?"
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mínimo 8 caracteres"
          hint={
            password
              ? `Força: ${
                  ["fraca", "razoável", "boa", "forte"][
                    Math.max(0, passwordStrength - 1)
                  ] ?? "fraca"
                }`
              : "Use letras, números e um símbolo para uma senha forte."
          }
        />

        {error && (
          <p className="text-sm text-ember-dark" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          loading={loading}
          fullWidth
          leadingIcon={<UserPlus size={16} />}
        >
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-ember-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded px-1"
        >
          Entrar
        </Link>
      </p>
    </Card>
  );
}

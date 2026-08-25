import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso em Client Components ("use client").
 * As chaves aqui são a URL pública e a chave anônima (anon key),
 * que são seguras para o navegador porque o acesso aos dados
 * é controlado pelas policies de Row Level Security no banco.
 * Nenhuma chave privada (service role) deve ser usada no frontend.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

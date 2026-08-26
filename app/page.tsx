import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing: redireciona o usuário autenticado para o "Hoje" e
 * os visitantes para a tela de login. Mantida server-side
 * para evitar flash de UI.
 */
export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/hoje" : "/login");
}

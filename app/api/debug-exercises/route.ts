import { createClient } from "@/lib/supabase/server";
import { listExercises } from "@/app/(app)/treinos/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "nao autenticado" }, { status: 401 });

  const library = await listExercises({ scope: "global" });
  const sample = library.slice(0, 3).map((ex) => ({
    name: ex.name,
    demonstration_url: ex.demonstration_url,
    demonstration_type: ex.demonstration_type,
    typeofDemo: typeof ex.demonstration_url,
  }));
  return Response.json({
    total: library.length,
    comDemo: library.filter((ex) => ex.demonstration_url != null).length,
    sample,
  });
}

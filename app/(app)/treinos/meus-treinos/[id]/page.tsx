import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanEditor } from "../../PlanEditor";
import { getWorkoutPlan, listExercises } from "../../actions";
import { getExerciseMediaSignedUrl } from "@/lib/exercise-images";

export const dynamic = "force-dynamic";

export default async function PlanoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plan = await getWorkoutPlan(params.id);
  if (!plan) notFound();

  let library: Awaited<ReturnType<typeof listExercises>> = [];
  try {
    // Apenas catálogo global: ao montar um plano, o usuário só escolhe
    // exercícios pré-determinados pelo sistema.
    library = await listExercises({ scope: "global" });
  } catch (err) {
    // Não derruba a página se a library falhar (ex: coluna não existe).
    console.error("[plan detail] listExercises falhou:", err);
  }

  // Signed URLs com prioridade para animation_url (gif/vídeo) > image_url.
  // O picker só mostra exercícios do catálogo global (~140), então
  // geramos a URL pra todos para garantir que cada card renderize sua
  // imagem. Para storage path a chamada a getSignedFileUrl é barata;
  // para absoluta é passthrough. Para entradas sem image_url/animation_url
  // o helper consulta o mapa TS (in-memory), sem custo de I/O.
  const signedEntries = await Promise.all(
    library.map(async (ex) => {
      try {
        return {
          id: ex.id,
          url: await getExerciseMediaSignedUrl(
            supabase,
            ex.image_url,
            ex.animation_url,
            ex.name,
          ),
        };
      } catch {
        return { id: ex.id, url: null };
      }
    }),
  );
  const urlMap = new Map(signedEntries.map((s) => [s.id, s.url]));

  return (
    <div className="mx-auto max-w-3xl">
      <PlanEditor
        plan={plan}
        library={library.map((ex) => ({
          id: ex.id,
          name: ex.name,
          primary_muscle: ex.primary_muscle,
          secondary_muscles: ex.secondary_muscles,
          equipment: ex.equipment,
          image_url: ex.image_url,
          animation_url: ex.animation_url,
          user_id: ex.user_id,
          category: ex.category,
          aliases: ex.aliases,
          machine_type: ex.machine_type,
          instructions: ex.instructions,
          signedUrl: urlMap.get(ex.id) ?? null,
        }))}
      />
    </div>
  );
}

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

  const library = await listExercises();

  // Signed URLs com prioridade para animation_url (gif/vídeo) > image_url.
  // Limite a 80 entradas para evitar custos altos de signed URL.
  const signedEntries = await Promise.all(
    library.slice(0, 80).map(async (ex) => ({
      id: ex.id,
      url: await getExerciseMediaSignedUrl(
        supabase,
        ex.image_url,
        ex.animation_url,
      ),
    })),
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
          signedUrl: urlMap.get(ex.id) ?? null,
        }))}
      />
    </div>
  );
}

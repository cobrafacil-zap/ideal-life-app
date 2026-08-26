import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanEditor } from "../../PlanEditor";
import { getWorkoutPlan, listExercises } from "../../actions";
import { getExerciseImageSignedUrl } from "@/lib/exercise-images";

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

  // Signed URLs limitadas a 40 pra evitar custos altos.
  const signedUrls = await Promise.all(
    library.slice(0, 40).map(async (ex) => ({
      id: ex.id,
      url: ex.image_url
        ? await getExerciseImageSignedUrl(supabase, ex.image_url)
        : null,
    })),
  );
  const urlMap = new Map(signedUrls.map((s) => [s.id, s.url]));

  return (
    <div className="mx-auto max-w-3xl">
      <PlanEditor
        plan={plan}
        library={library.map((ex) => ({
          id: ex.id,
          name: ex.name,
          primary_muscle: ex.primary_muscle,
          user_id: ex.user_id,
          signedUrl: urlMap.get(ex.id) ?? null,
        }))}
      />
    </div>
  );
}

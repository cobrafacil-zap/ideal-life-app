import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutRunner } from "../../WorkoutRunner";
import { listExercises } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SessaoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select(
      "id, workout_name, started_at, finished_at, workout_plan_id",
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (sessionError) throw new Error(sessionError.message);
  if (!session) notFound();

  // Se a sessão já foi finalizada, redireciona pro histórico.
  if (session.finished_at) {
    redirect(`/treinos/historico#session-${session.id}`);
  }

  const [{ data: sets }, { data: planExercises }, library] = await Promise.all([
    supabase
      .from("exercise_sets")
      .select(
        "id, exercise_id, exercise_name, set_number, reps, load, load_unit, rpe, discomfort",
      )
      .eq("workout_session_id", session.id)
      .eq("user_id", user.id)
      .order("set_number", { ascending: true })
      .order("created_at", { ascending: true }),
    session.workout_plan_id
      ? supabase
          .from("workout_plan_exercises")
          .select(
            "id, exercise_id, exercise_name, target_sets, target_reps, target_load, load_unit, rest_seconds",
          )
          .eq("workout_plan_id", session.workout_plan_id)
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    listExercises(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <WorkoutRunner
        sessionId={session.id}
        workoutName={session.workout_name}
        startedAt={session.started_at}
        planExercises={(planExercises ?? []) as any}
        initialSets={(sets ?? []) as any}
        library={library}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { startOfWeekISO, todayBR } from "@/lib/datetime";
import {
  WeeklySchedule,
  WeeklyHeader,
  type SchedulePlan,
} from "../WeeklySchedule";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayBR();
  const weekStart = startOfWeekISO().slice(0, 10); // yyyy-MM-dd
  // calcula a data do próximo domingo
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const endIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

  const [{ data: plans }, { data: sessions }] = await Promise.all([
    supabase
      .from("workout_plans")
      .select("id, name, is_active, scheduled_weekday, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("workout_sessions")
      .select("id, workout_name, started_at, finished_at")
      .eq("user_id", user.id)
      .gte("started_at", `${weekStart}T00:00:00`)
      .lt("started_at", `${endIso}T00:00:00`),
  ]);

  // Agrupa sessões por dia (yyyy-MM-dd em SP).
  const sessionsByDate: Record<
    string,
    { id: string; workout_name: string; finished: boolean }[]
  > = {};

  for (const s of sessions ?? []) {
    const startedAt = new Date(s.started_at);
    // SP offset (UTC-3) — usamos toLocaleString para extrair yyyy-MM-dd em SP.
    const spDateStr = startedAt.toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
    if (!sessionsByDate[spDateStr]) sessionsByDate[spDateStr] = [];
    sessionsByDate[spDateStr].push({
      id: s.id,
      workout_name: s.workout_name,
      finished: !!s.finished_at,
    });
  }

  const schedulePlans: SchedulePlan[] = (plans ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    is_active: !!p.is_active,
    scheduled_weekday: p.scheduled_weekday,
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        title="Agenda semanal"
        subtitle="Marque quais dias você quer treinar."
      />

      <Card>
        <CardHeader
          title="Sua semana"
          description="Atribua planos aos dias e clique em Iniciar para começar uma sessão."
        />
        <WeeklyHeader weekStart={weekStart} />
        <div className="mt-3">
          <WeeklySchedule
            plans={schedulePlans}
            weekStart={weekStart}
            sessionsByDate={sessionsByDate}
            todayDate={today}
          />
        </div>
      </Card>
    </div>
  );
}

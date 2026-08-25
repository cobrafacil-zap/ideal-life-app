import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { NewCycleForm, DailySymptomsForm } from "./CycleForms";
import { differenceInCalendarDays } from "date-fns";

export default async function CicloPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cycles } = await supabase
    .from("menstrual_cycles")
    .select("start_date, end_date")
    .eq("user_id", user!.id)
    .order("start_date", { ascending: false })
    .limit(12);

  const latest = cycles?.[0];
  const cycleDay = latest ? differenceInCalendarDays(new Date(), new Date(latest.start_date)) + 1 : null;

  let avgCycleLength: number | null = null;
  if (cycles && cycles.length > 1) {
    const gaps: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      gaps.push(
        differenceInCalendarDays(new Date(cycles[i].start_date), new Date(cycles[i + 1].start_date))
      );
    }
    avgCycleLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }

  const nextPredicted =
    latest && avgCycleLength
      ? differenceInCalendarDays(
          new Date(new Date(latest.start_date).getTime() + avgCycleLength * 86400000),
          new Date()
        )
      : null;

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Ciclo Menstrual</h1>
        <p className="text-sm text-ink-soft">Acompanhamento discreto e privado.</p>
      </header>

      <Card className="bg-moss-gradient text-white shadow-floating">
        {cycleDay ? (
          <>
            <p className="text-sm text-white/80">Você está no</p>
            <p className="font-mono text-3xl font-bold">Dia {cycleDay}</p>
            {nextPredicted !== null && (
              <p className="mt-1 text-sm text-white/80">
                Próxima menstruação estimada em {Math.max(nextPredicted, 0)} dias
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-white/90">
            Registre o início do seu ciclo mais recente para começar o acompanhamento.
          </p>
        )}
      </Card>

      {avgCycleLength && (
        <Card className="flex justify-around text-center">
          <div>
            <p className="font-mono text-xl font-semibold">{avgCycleLength}</p>
            <p className="text-[12px] text-ink-faint">dias em média</p>
          </div>
          <div>
            <p className="font-mono text-xl font-semibold">{cycles?.length ?? 0}</p>
            <p className="text-[12px] text-ink-faint">ciclos registrados</p>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Novo ciclo</h2>
        <NewCycleForm />
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold">Sintomas de hoje</h2>
        <DailySymptomsForm />
      </Card>

      <p className="px-1 text-[11px] leading-relaxed text-ink-faint">
        As previsões de ovulação e período fértil são estimativas baseadas nos ciclos
        registrados e não devem ser usadas isoladamente como método contraceptivo ou
        diagnóstico médico.
      </p>
    </div>
  );
}

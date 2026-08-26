"use client";

import { useMemo, useState, useTransition } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { logWeight } from "./actions";
import { EmptyState } from "@/components/EmptyState";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

export function WeightSection({
  history,
}: {
  history: { weight_kg: number; measured_at: string }[];
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((h) => ({
          date: format(new Date(h.measured_at), "dd/MM", { locale: ptBR }),
          peso: Number(h.weight_kg),
        })),
    [history]
  );

  const trend = useMemo(() => {
    if (history.length < 2) return null;
    const latest = history[0].weight_kg;
    const previous = history[1].weight_kg;
    const diff = latest - previous;
    return { diff, latest, previous };
  }, [history]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseFloat(value.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 20 || parsed > 400) {
      setError("Informe um peso válido (entre 20 e 400 kg).");
      return;
    }
    startTransition(async () => {
      await logWeight(parsed);
      setValue("");
    });
  }

  const lastEntry = history[0];

  return (
    <div>
      {lastEntry && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-wide text-ink-faint">
              Última medição
            </p>
            <p className="font-mono text-3xl font-bold text-ink">
              {Number(lastEntry.weight_kg).toFixed(1)} <span className="text-base text-ink-soft">kg</span>
            </p>
            <p className="text-[12px] text-ink-faint">
              {formatDistanceToNow(new Date(lastEntry.measured_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[12px] font-semibold",
                trend.diff > 0 && "bg-ember-soft text-ember-dark",
                trend.diff < 0 && "bg-moss-soft text-moss-dark",
                trend.diff === 0 && "bg-line/50 text-ink-soft"
              )}
            >
              {trend.diff > 0 ? (
                <TrendingUp size={14} aria-hidden="true" />
              ) : trend.diff < 0 ? (
                <TrendingDown size={14} aria-hidden="true" />
              ) : (
                <Minus size={14} aria-hidden="true" />
              )}
              {trend.diff > 0 ? "+" : ""}
              {trend.diff.toFixed(1)} kg vs. medição anterior
            </div>
          )}
        </div>
      )}

      {chartData.length > 1 ? (
        <div className="h-48 sm:h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="#E7E2D8" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#8A9490" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E7E2D8",
                  fontSize: 12,
                  boxShadow: "0 8px 24px -12px rgba(22,28,26,0.18)",
                }}
                formatter={(v: number) => [`${v} kg`, "Peso"]}
                labelStyle={{ color: "#4B5550" }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#FF6A39"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#FF6A39", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          icon={Scale}
          title="Sem dados suficientes ainda"
          description="Registre seu peso algumas vezes para acompanhar a evolução no gráfico."
          className="mb-4"
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <TextField
            label="Registrar peso (kg)"
            type="text"
            inputMode="decimal"
            placeholder="74,0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={error ?? undefined}
            hint="Use ponto ou vírgula para separar casas decimais."
            trailingAdornment="kg"
          />
        </div>
        <Button type="submit" loading={isPending} disabled={!value} fullWidth={false} className="sm:w-auto">
          Salvar
        </Button>
      </form>
    </div>
  );
}

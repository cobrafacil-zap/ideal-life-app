"use client";

import { useState, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { logWeight } from "./actions";

export function WeightSection({
  history,
}: {
  history: { weight_kg: number; measured_at: string }[];
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const chartData = [...history]
    .reverse()
    .map((h) => ({
      date: format(new Date(h.measured_at), "dd/MM", { locale: ptBR }),
      peso: h.weight_kg,
    }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value.replace(",", "."));
    if (Number.isNaN(parsed)) return;
    startTransition(async () => {
      await logWeight(parsed);
      setValue("");
    });
  }

  return (
    <div>
      {chartData.length > 1 ? (
        <div className="h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A9490" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E7E2D8", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#FF6A39"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#FF6A39" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-ink-faint">
          Registre seu peso algumas vezes para ver o gráfico de evolução.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Registrar peso (kg)"
            type="text"
            inputMode="decimal"
            placeholder="74.0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isPending} disabled={!value}>
          Salvar
        </Button>
      </form>
    </div>
  );
}

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const AXIS = { fill: "var(--ink-faint)", fontSize: 11 };

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "%",
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-float">
      {label !== undefined ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      ) : null}
      {payload.map((entry, i) => (
        <p key={i} className="text-[13px] font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? Math.round(entry.value) : entry.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

/** Evolução do progresso geral / pessoal / profissional. */
export function EvolutionChart({
  data,
  height = 260,
}: {
  data: Array<{ label: string; geral: number; pessoal: number; profissional: number }>;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillGeral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--iris)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--iris)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS} domain={[0, 100]} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "var(--ink-soft)", fontSize: 12, fontWeight: 600 }}>
                {value === "geral" ? "Geral" : value === "pessoal" ? "Pessoal" : "Profissional"}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="geral"
            stroke="var(--iris)"
            strokeWidth={2.5}
            fill="url(#fillGeral)"
          />
          <Area
            type="monotone"
            dataKey="pessoal"
            stroke="var(--jade)"
            strokeWidth={1.8}
            fill="none"
            strokeDasharray="4 3"
          />
          <Area
            type="monotone"
            dataKey="profissional"
            stroke="var(--amber)"
            strokeWidth={1.8}
            fill="none"
            strokeDasharray="4 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Metas concluídas por mês. */
export function CompletedChart({
  data,
  height = 220,
}: {
  data: Array<{ label: string; total: number }>;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS} allowDecimals={false} width={36} />
          <Tooltip
            content={<ChartTooltip suffix="" />}
            cursor={{ fill: "var(--ink)", fillOpacity: 0.04 }}
          />
          <Bar dataKey="total" name="Concluídas" radius={[6, 6, 0, 0]} maxBarSize={38}>
            {data.map((_, i) => (
              <Cell key={i} fill="var(--iris)" fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Progresso por categoria (barras horizontais). */
export function CategoryChart({
  data,
  height = 240,
}: {
  data: Array<{ name: string; color: string; progress: number; total: number; concluidas: number }>;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={104}
            tick={{ ...AXIS, fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--ink)", fillOpacity: 0.04 }}
          />
          <Bar dataKey="progress" name="Progresso" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Histórico de progresso de uma meta. */
export function GoalHistoryChart({
  data,
  height = 240,
  color = "var(--iris)",
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS} width={44} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Progresso"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Comparativo pessoal × profissional. */
export function ScopeChart({
  data,
  height = 220,
}: {
  data: Array<{ label: string; pessoal: number; profissional: number }>;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS} domain={[0, 100]} width={40} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--ink)", fillOpacity: 0.04 }} />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "var(--ink-soft)", fontSize: 12, fontWeight: 600 }}>
                {value === "pessoal" ? "Pessoal" : "Profissional"}
              </span>
            )}
          />
          <Bar dataKey="pessoal" name="pessoal" fill="var(--jade)" radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="profissional" name="profissional" fill="var(--iris)" radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ChartTooltip };
export const chartCardClass = cn("rounded-card border border-line bg-surface p-5 shadow-card");

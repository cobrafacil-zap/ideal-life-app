"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, useChartTheme } from "@/lib/chart-theme";

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "%",
  theme,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  suffix?: string;
  theme: "light" | "dark";
}) {
  const c = CHART_COLORS[theme];
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.grid}`,
        borderRadius: 12,
        boxShadow: "0 12px 32px -12px rgba(0,0,0,0.35)",
        padding: "8px 12px",
      }}
    >
      {label !== undefined ? (
        <p
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: c.axis,
          }}
        >
          {label}
        </p>
      ) : null}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: 0, fontSize: 13, fontWeight: 600, color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? Math.round(entry.value) : entry.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

function LegendLabel({ value, color }: { value: string; color: string }) {
  return (
    <span style={{ color, fontSize: 12, fontWeight: 600, marginLeft: 6 }}>{value}</span>
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
  const theme = useChartTheme();
  const c = CHART_COLORS[theme];
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillGeral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.iris} stopOpacity={0.34} />
              <stop offset="100%" stopColor={c.iris} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            domain={[0, 100]}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip theme={theme} />}
            cursor={{ stroke: c.grid }}
          />
          <Area
            type="monotone"
            dataKey="geral"
            name="Geral"
            stroke={c.iris}
            strokeWidth={2.5}
            fill="url(#fillGeral)"
            dot={false}
            activeDot={{ r: 4, fill: c.iris }}
          />
          <Area
            type="monotone"
            dataKey="pessoal"
            name="Pessoal"
            stroke={c.jade}
            strokeWidth={1.8}
            fill="none"
            strokeDasharray="4 3"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="profissional"
            name="Profissional"
            stroke={c.amber}
            strokeWidth={1.8}
            fill="none"
            strokeDasharray="4 3"
            dot={false}
          />
          <LegendRow
            items={[
              { label: "Geral", color: c.iris },
              { label: "Pessoal", color: c.jade },
              { label: "Profissional", color: c.amber },
            ]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendRow({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="mb-2 flex items-center justify-center gap-4">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: item.color }}
          />
          <span className="text-[12px] font-semibold text-ink-soft">{item.label}</span>
        </span>
      ))}
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
  const theme = useChartTheme();
  const c = CHART_COLORS[theme];
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            content={<ChartTooltip theme={theme} suffix="" />}
            cursor={{ fill: c.axis, fillOpacity: 0.08 }}
          />
          <Bar
            dataKey="total"
            name="Concluídas"
            radius={[6, 6, 0, 0]}
            maxBarSize={38}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={c.iris} fillOpacity={0.9} />
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
  const theme = useChartTheme();
  const c = CHART_COLORS[theme];
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={104}
            tick={{ fill: c.axis, fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip
            content={<ChartTooltip theme={theme} />}
            cursor={{ fill: c.axis, fillOpacity: 0.08 }}
          />
          <Bar
            dataKey="progress"
            name="Progresso"
            radius={[0, 6, 6, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.95} />
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
  color,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}) {
  const theme = useChartTheme();
  const c = CHART_COLORS[theme];
  const stroke = color ?? c.iris;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            width={44}
          />
          <Tooltip content={<ChartTooltip theme={theme} />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Progresso"
            stroke={stroke}
            strokeWidth={2.5}
            dot={{ r: 3, fill: stroke, strokeWidth: 0 }}
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
  const theme = useChartTheme();
  const c = CHART_COLORS[theme];
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            domain={[0, 100]}
            width={40}
          />
          <Tooltip
            content={<ChartTooltip theme={theme} />}
            cursor={{ fill: c.axis, fillOpacity: 0.08 }}
          />
          <Bar
            dataKey="pessoal"
            name="Pessoal"
            fill={c.jade}
            radius={[6, 6, 0, 0]}
            maxBarSize={26}
            isAnimationActive={false}
          />
          <Bar
            dataKey="profissional"
            name="Profissional"
            fill={c.iris}
            radius={[6, 6, 0, 0]}
            maxBarSize={26}
            isAnimationActive={false}
          />
          <LegendRow
            items={[
              { label: "Pessoal", color: c.jade },
              { label: "Profissional", color: c.iris },
            ]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tendência única (progresso geral do portfólio). */
export function TrendChart({
  data,
  height = 220,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
}) {
  const theme = useChartTheme();
  const c = CHART_COLORS[theme];
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.iris} stopOpacity={0.32} />
              <stop offset="100%" stopColor={c.iris} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.axis, fontSize: 11 }}
            domain={[0, 100]}
            width={40}
          />
          <Tooltip content={<ChartTooltip theme={theme} />} cursor={{ stroke: c.grid }} />
          <Area
            type="monotone"
            dataKey="value"
            name="Progresso geral"
            stroke={c.iris}
            strokeWidth={2.5}
            fill="url(#fillTrend)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ChartTooltip, LegendLabel };

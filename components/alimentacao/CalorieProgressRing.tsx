"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

interface CalorieProgressRingProps {
  consumed: number;
  goal: number | null;
  mealCount: number;
  avgPerMeal: number;
}

/**
 * Card de cabeçalho do dia: ring de progresso + consumido/limite.
 * Se não há `goal`, mostra só o total sem ring.
 */
export function CalorieProgressRing({
  consumed,
  goal,
  mealCount,
  avgPerMeal,
}: CalorieProgressRingProps) {
  const hasGoal = goal != null && goal > 0;
  const pct = hasGoal ? Math.min(100, Math.round((consumed / (goal as number)) * 100)) : 0;
  const over = hasGoal && consumed > (goal as number);
  const remaining = hasGoal ? Math.max(0, (goal as number) - consumed) : null;

  // Ring geometry
  const size = 96;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col gap-4 p-6 sm:p-7 sm:flex-row sm:items-center sm:justify-between bg-ember-gradient text-white">
      <div className="flex items-center gap-4">
        {hasGoal && (
          <div className="relative shrink-0" aria-hidden="true">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={circumference / 4}
                strokeLinecap="round"
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                  transition: "stroke-dasharray 0.5s ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-base font-bold leading-none">
                {pct}%
              </span>
            </div>
          </div>
        )}
        <div>
          <p className="text-sm text-white/85">
            {hasGoal ? "Hoje você consumiu" : "Calorias hoje"}
          </p>
          <p className="font-mono text-3xl sm:text-4xl font-bold leading-tight">
            {consumed.toLocaleString("pt-BR")} kcal
          </p>
          {hasGoal && (
            <p className="mt-1 text-[12px] text-white/80">
              de{" "}
              <span className="font-mono font-semibold">
                {(goal as number).toLocaleString("pt-BR")} kcal
              </span>{" "}
              ·{" "}
              {over ? (
                <span className="font-semibold text-white">
                  +{(consumed - (goal as number)).toLocaleString("pt-BR")} acima
                </span>
              ) : (
                <span className="font-semibold text-white">
                  {remaining!.toLocaleString("pt-BR")} restantes
                </span>
              )}
            </p>
          )}
          {!hasGoal && (
            <p className="mt-1 text-[12px] text-white/80">
              <Link
                href="/perfil"
                className={cn(
                  "underline-offset-2 hover:underline",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember rounded-sm",
                )}
              >
                Defina sua meta calórica em /perfil
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-6 sm:gap-8">
        <div>
          <p className="text-[12px] text-white/80">Refeições</p>
          <p className="font-mono text-lg font-semibold">{mealCount}</p>
        </div>
        <div>
          <p className="text-[12px] text-white/80">Média</p>
          <p className="font-mono text-lg font-semibold">
            {avgPerMeal} kcal
          </p>
        </div>
        {hasGoal && (
          <div>
            <p className="text-[12px] text-white/80">Por refeição</p>
            <p className="font-mono text-lg font-semibold">
              {Math.round((goal as number) / Math.max(mealCount + 1, 1))} kcal
            </p>
            <p className="text-[10px] text-white/70">restantes ÷ refeições</p>
          </div>
        )}
      </div>
    </div>
  );
}
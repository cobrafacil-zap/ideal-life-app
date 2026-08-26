"use client";

import { useRouter } from "next/navigation";

export function HistoryClient({ rangeDays }: { rangeDays: number }) {
  const router = useRouter();
  const options: { value: string; label: string }[] = [
    { value: "7", label: "7 dias" },
    { value: "30", label: "30 dias" },
    { value: "90", label: "90 dias" },
    { value: "365", label: "1 ano" },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-ink-faint">
        Período
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = Number(o.value) === rangeDays;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => router.push(`/treinos/historico?range=${o.value}`)}
              className={
                "rounded-pill border px-2.5 py-1 text-[12px] " +
                (active
                  ? "border-ember/40 bg-ember-soft text-ember-dark"
                  : "border-line bg-surface text-ink-soft hover:text-ink")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

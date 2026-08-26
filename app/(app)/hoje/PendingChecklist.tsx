"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, Droplets, Heart, Utensils, Dumbbell, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { addWater } from "./actions";
import type { LucideIcon } from "lucide-react";

/**
 * "O QUE FALTA HOJE" — checklist derivado do estado atual.
 *
 * Cada item é uma expressão booleana sobre o estado. Sem persistência
 * própria — quando o usuário faz a ação (água/refeição/treino/check-in),
 * o item sai naturalmente no próximo render do server.
 *
 * O item de água tem ação inline (botão +) que chama `addWater(suggestedAmount)`
 * direto; os outros são links para as páginas relevantes.
 */

type ItemKind = "water" | "calories" | "workout" | "checkin";

export interface PendingItem {
  kind: ItemKind;
  label: string;
  description?: string;
  done: boolean;
  /** href para navegação (não usado no item water — tem ação inline). */
  href?: string;
  /** amountMl para o item water quando pendente (sugestão de +). */
  amountMl?: number;
}

interface PendingChecklistProps {
  items: PendingItem[];
}

const ICONS: Record<ItemKind, LucideIcon> = {
  water: Droplets,
  calories: Utensils,
  workout: Dumbbell,
  checkin: Heart,
};

export function PendingChecklist({ items }: PendingChecklistProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="O que falta hoje"
        description="Marque conforme for fazendo ao longo do dia."
      />
      <ul className="space-y-2">
        {items.map((item) => (
          <ChecklistRow key={item.kind} item={item} />
        ))}
      </ul>
    </Card>
  );
}

function ChecklistRow({ item }: { item: PendingItem }) {
  const Icon = ICONS[item.kind];
  return (
    <li>
      {item.done ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl bg-moss-soft/40 px-3 py-2.5",
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-moss text-white">
            <Check size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink line-through decoration-2 decoration-moss/40">
              {item.label}
            </p>
            {item.description && (
              <p className="text-[11px] text-ink-faint">{item.description}</p>
            )}
          </div>
        </div>
      ) : item.kind === "water" && item.amountMl ? (
        <WaterRow item={item} />
      ) : (
        <Link
          href={item.href ?? "#"}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-line/40 bg-surface px-3 py-2.5 transition-colors",
            "hover:border-ember/40 hover:bg-base/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ember-soft text-ember">
            <Icon size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{item.label}</p>
            {item.description && (
              <p className="text-[11px] text-ink-soft">{item.description}</p>
            )}
          </div>
          <span aria-hidden="true" className="text-ink-faint">→</span>
        </Link>
      )}
    </li>
  );
}

function WaterRow({ item }: { item: PendingItem }) {
  const [isPending, startTransition] = useTransition();
  function handleAdd() {
    if (!item.amountMl) return;
    startTransition(async () => {
      await addWater(item.amountMl!);
    });
  }
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line/40 bg-surface px-3 py-2.5",
        "hover:border-ember/40 transition-colors",
      )}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ember-soft text-ember">
        <Droplets size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink">{item.label}</p>
        {item.description && (
          <p className="text-[11px] text-ink-soft">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isPending}
        aria-label={`Registrar ${item.amountMl}ml agora`}
        className={cn(
          "inline-flex items-center gap-1 rounded-pill px-3 py-1.5",
          "bg-ember text-white text-[12px] font-semibold",
          "hover:bg-ember-dark active:scale-[0.97] disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "transition-all",
        )}
      >
        <Plus size={12} aria-hidden="true" />
        {item.amountMl}ml
      </button>
    </div>
  );
}

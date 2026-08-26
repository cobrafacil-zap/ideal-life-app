import {
  Sun,
  HeartPulse,
  Utensils,
  Dumbbell,
  Droplets,
  CircleUserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  description: string;
}

export const navItems: NavItem[] = [
  {
    href: "/hoje",
    label: "Hoje",
    icon: Sun,
    description: "Check-in, água e resumo do dia",
  },
  {
    href: "/saude",
    label: "Saúde",
    icon: HeartPulse,
    description: "Peso, IMC, cardio e perfil físico",
  },
  {
    href: "/alimentacao",
    label: "Alimentação",
    icon: Utensils,
    description: "Refeições e calorias do dia",
  },
  {
    href: "/treinos",
    label: "Treinos",
    icon: Dumbbell,
    description: "Meus treinos, exercícios e séries",
  },
  {
    href: "/ciclo",
    label: "Ciclo",
    icon: Droplets,
    description: "Ciclo menstrual, sintomas e previsões",
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: CircleUserRound,
    description: "Metas, conta e preferências",
  },
];

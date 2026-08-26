import { clsx, type ClassValue } from "clsx";

/**
 * Wrapper de clsx para manter consistência nas importações
 * e permitir trocas futuras (ex.: tailwind-merge) sem refatorar
 * os call sites.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

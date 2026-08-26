-- Fluxo diário do ciclo menstrual.
--
-- Adiciona coluna `flow_intensity` em `menstrual_daily_logs` para registrar
-- a intensidade do fluxo menstrual DIA A DIA (leve/moderado/intenso).
-- Sem isso, a intensidade só era capturada no início do ciclo
-- (`menstrual_cycles.flow_intensity`), o que não permitia acompanhar
-- a evolução ao longo dos dias.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS + DROP/ADD CONSTRAINT.

ALTER TABLE public.menstrual_daily_logs
  ADD COLUMN IF NOT EXISTS flow_intensity TEXT;

-- CHECK constraint (drop + add pra ser idempotente sem precisar DO block).
ALTER TABLE public.menstrual_daily_logs
  DROP CONSTRAINT IF EXISTS menstrual_daily_logs_flow_intensity_check;
ALTER TABLE public.menstrual_daily_logs
  ADD CONSTRAINT menstrual_daily_logs_flow_intensity_check
  CHECK (flow_intensity IS NULL OR flow_intensity IN ('leve','moderado','intenso'));

-- Tabela para armazenar o resumo diário gerado pelo botão "Encerrar meu dia".
-- Cada linha = um dia encerrado. UNIQUE por (user_id, summary_date) impede duplo fechamento.
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date date NOT NULL,
  completed_count smallint NOT NULL CHECK (completed_count BETWEEN 0 AND 5),
  kcal_consumed integer,
  water_ml integer,
  cardio_min integer,
  workout_min integer,
  wellbeing_pct smallint,
  closed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, summary_date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read" ON public.daily_summaries;
DROP POLICY IF EXISTS "owner_write" ON public.daily_summaries;
CREATE POLICY "owner_read" ON public.daily_summaries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_write" ON public.daily_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

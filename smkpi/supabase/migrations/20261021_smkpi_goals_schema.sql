-- ============================================================================
-- SMKPI — schema de metas pessoais e profissionais
-- Tabelas novas (prefixo goal_*) + hábitos + sonhos, com RLS por auth.uid().
-- Idempotente: pode ser executado quantas vezes for necessário.
-- ============================================================================

-- ── Categorias ─────────────────────────────────────────────────────────────
create table if not exists public.goal_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text not null,
  color       text not null default '#4F46E5',
  icon        text not null default 'target',
  scope       text not null default 'neutro' check (scope in ('pessoal','profissional','neutro')),
  is_custom   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

-- ── Metas ──────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  description       text not null default '',
  category_id       uuid references public.goal_categories(id) on delete set null,
  scope             text not null default 'neutro' check (scope in ('pessoal','profissional','neutro')),
  priority          text not null default 'media' check (priority in ('baixa','media','alta','urgente')),
  status            text not null default 'ativa' check (status in ('ativa','concluida','pausada')),
  cadence           text not null default 'sem-prazo' check (cadence in ('anual','mensal','semanal','sem-prazo')),
  start_date        date,
  due_date          date,
  parent_goal_id    uuid references public.goals(id) on delete set null,
  metric_start      numeric,
  metric_current    numeric,
  metric_target     numeric,
  metric_unit       text not null default '',
  metric_direction  text not null default 'increase' check (metric_direction in ('increase','decrease')),
  icon              text not null default 'target',
  cover             text,
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_category_idx on public.goals(category_id);
create index if not exists goals_parent_idx on public.goals(parent_goal_id);
create index if not exists goals_due_date_idx on public.goals(due_date);

-- ── Etapas ─────────────────────────────────────────────────────────────────
create table if not exists public.goal_steps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  goal_id     uuid not null references public.goals(id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  done_at     date,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists goal_steps_goal_idx on public.goal_steps(goal_id);
create index if not exists goal_steps_user_idx on public.goal_steps(user_id);

-- ── Histórico de progresso ────────────────────────────────────────────────
create table if not exists public.goal_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  goal_id     uuid not null references public.goals(id) on delete cascade,
  logged_at   date not null default current_date,
  value       numeric not null,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists goal_progress_goal_idx on public.goal_progress(goal_id);
create index if not exists goal_progress_logged_idx on public.goal_progress(logged_at);

-- ── Hábitos ───────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  goal_id           uuid references public.goals(id) on delete set null,
  title             text not null,
  icon              text not null default 'check',
  color             text not null default '#4F46E5',
  target_per_week   integer not null default 5,
  created_at        timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits(user_id);

create table if not exists public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  habit_id    uuid not null references public.habits(id) on delete cascade,
  log_date    date not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index if not exists habit_logs_habit_idx on public.habit_logs(habit_id);
create index if not exists habit_logs_date_idx on public.habit_logs(log_date);

-- ── Sonhos ────────────────────────────────────────────────────────────────
create table if not exists public.dreams (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  description       text not null default '',
  image_url         text,
  estimated_value   numeric,
  desired_date      date,
  status            text not null default 'sonho' check (status in ('sonho','em_andamento','concluido')),
  goal_id           uuid references public.goals(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists dreams_user_idx on public.dreams(user_id);

-- ── Conquistas ────────────────────────────────────────────────────────────
create table if not exists public.goal_achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  tier        integer not null default 1,
  unlocked_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists goal_achievements_user_idx on public.goal_achievements(user_id);

-- ── Configurações ─────────────────────────────────────────────────────────
create table if not exists public.goal_settings (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  display_name            text not null default '',
  currency                text not null default 'BRL',
  theme                   text not null default 'system' check (theme in ('light','dark','system')),
  notifications_enabled   boolean not null default true,
  notify_stale_days       integer not null default 7,
  notify_due_days         integer not null default 10,
  notify_near_completion  integer not null default 85,
  updated_at              timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — cada usuário só enxerga os próprios dados
-- ══════════════════════════════════════════════════════════════════════════
do $$
declare
  t text;
begin
  foreach t in array array[
    'goal_categories','goals','goal_steps','goal_progress',
    'habits','habit_logs','dreams','goal_achievements','goal_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);

    execute format(
      'create policy "%s_select_own" on public.%I for select to authenticated using (auth.uid() = user_id)',
      t, t);
    execute format(
      'create policy "%s_insert_own" on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      t, t);
    execute format(
      'create policy "%s_update_own" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t);
    execute format(
      'create policy "%s_delete_own" on public.%I for delete to authenticated using (auth.uid() = user_id)',
      t, t);
  end loop;
end $$;

-- goal_settings usa user_id como PK — a policy de select precisa respeitar isso
drop policy if exists "goal_settings_select_own" on public.goal_settings;
create policy "goal_settings_select_own" on public.goal_settings
  for select to authenticated using (auth.uid() = user_id);

-- ── updated_at automático ─────────────────────────────────────────────────
create or replace function public.set_goal_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_goal_updated_at();

drop trigger if exists goal_settings_set_updated_at on public.goal_settings;
create trigger goal_settings_set_updated_at
  before update on public.goal_settings
  for each row execute function public.set_goal_updated_at();

-- =========================================================================
-- VITTA — Schema inicial (Fase 1: Perfil, Saúde Física, Alimentação, Ciclo)
-- Rode este arquivo no SQL Editor do seu projeto Supabase.
-- Todas as tabelas usam RLS: cada usuário só acessa seus próprios dados.
-- =========================================================================

-- Extensão para gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- FUNÇÃO utilitária: mantém updated_at sempre atualizado
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -------------------------------------------------------------------------
-- PROFILES — dados de perfil e metas do usuário
-- -------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  birth_date date,
  biological_sex text check (biological_sex in ('feminino', 'masculino', 'nao_informado')),
  height_cm numeric(5,1),
  activity_level text check (activity_level in ('sedentario','leve','moderado','ativo','muito_ativo')),
  weight_goal_kg numeric(5,1),
  water_goal_ml integer default 3000,
  cardio_weekly_goal_min integer default 150,
  workout_weekly_goal integer default 4,
  calorie_goal integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy "profiles: select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- Cria a linha de profile automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------------------
-- DAILY CHECKINS — energia / humor / disposição (0-10) por dia
-- -------------------------------------------------------------------------
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  energy smallint check (energy between 0 and 10),
  mood smallint check (mood between 0 and 10),
  disposition smallint check (disposition between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);
create trigger trg_checkins_updated_at before update on public.daily_checkins
  for each row execute function public.set_updated_at();

alter table public.daily_checkins enable row level security;
create policy "checkins: all own" on public.daily_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- BODY MEASUREMENTS — histórico de peso
-- -------------------------------------------------------------------------
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,1) not null,
  measured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.body_measurements enable row level security;
create policy "body_measurements: all own" on public.body_measurements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- EXERCISES — catálogo de exercícios (pode ter itens globais + do usuário)
-- -------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = catálogo global
  name text not null,
  primary_muscle text,
  secondary_muscles text[],
  equipment text,
  substitutes text[],
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.exercises enable row level security;
create policy "exercises: select own or global" on public.exercises for select
  using (user_id is null or auth.uid() = user_id);
create policy "exercises: insert own" on public.exercises for insert
  with check (auth.uid() = user_id);
create policy "exercises: update own" on public.exercises for update
  using (auth.uid() = user_id);
create policy "exercises: delete own" on public.exercises for delete
  using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- WORKOUT PLANS (ex: "Treino A - Ombro + Tríceps") e seus exercícios
-- -------------------------------------------------------------------------
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_workout_plans_updated_at before update on public.workout_plans
  for each row execute function public.set_updated_at();
alter table public.workout_plans enable row level security;
create policy "workout_plans: all own" on public.workout_plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null, -- cópia do nome para exibição rápida
  target_sets smallint not null default 3,
  target_reps text not null default '10-12', -- string p/ permitir faixas (ex "10-12")
  target_load numeric(6,2),
  load_unit text default 'kg' check (load_unit in ('kg','lb')),
  rest_seconds integer default 60,
  notes text,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);
alter table public.workout_plan_exercises enable row level security;
create policy "workout_plan_exercises: all own" on public.workout_plan_exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- WORKOUT SESSIONS — execução real de um treino + séries registradas
-- -------------------------------------------------------------------------
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id),
  workout_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.workout_sessions enable row level security;
create policy "workout_sessions: all own" on public.workout_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null,
  set_number smallint not null,
  reps smallint,
  load numeric(6,2),
  load_unit text default 'kg' check (load_unit in ('kg','lb')),
  created_at timestamptz not null default now()
);
alter table public.exercise_sets enable row level security;
create policy "exercise_sets: all own" on public.exercise_sets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- CARDIO SESSIONS
-- -------------------------------------------------------------------------
create table public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('esteira','caminhada','corrida','bicicleta','escada','eliptico','outro')),
  duration_min integer not null,
  distance_km numeric(5,2),
  intensity text check (intensity in ('leve','moderada','intensa')),
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.cardio_sessions enable row level security;
create policy "cardio_sessions: all own" on public.cardio_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- WATER LOGS
-- -------------------------------------------------------------------------
create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null,
  logged_at timestamptz not null default now(),
  log_date date not null default current_date
);
alter table public.water_logs enable row level security;
create policy "water_logs: all own" on public.water_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- MEALS / MEAL ITEMS / MEAL PHOTOS
-- -------------------------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('cafe_da_manha','almoco','lanche','jantar','ceia','outra')),
  meal_date date not null default current_date,
  logged_at timestamptz not null default now(),
  total_calories numeric(7,1),
  total_protein_g numeric(6,1),
  total_carbs_g numeric(6,1),
  total_fat_g numeric(6,1),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.meals enable row level security;
create policy "meals: all own" on public.meals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  quantity_g numeric(6,1),
  calories numeric(7,1),
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  source text default 'manual' check (source in ('manual','foto_ia')),
  created_at timestamptz not null default now()
);
alter table public.meal_items enable row level security;
create policy "meal_items: all own" on public.meal_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.meal_photos (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null, -- caminho dentro do bucket 'meal-photos'
  ai_raw_response jsonb,
  created_at timestamptz not null default now()
);
alter table public.meal_photos enable row level security;
create policy "meal_photos: all own" on public.meal_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- MENSTRUAL CYCLES + DAILY LOGS
-- -------------------------------------------------------------------------
create table public.menstrual_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow_intensity text check (flow_intensity in ('leve','moderado','intenso')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_menstrual_cycles_updated_at before update on public.menstrual_cycles
  for each row execute function public.set_updated_at();
alter table public.menstrual_cycles enable row level security;
create policy "menstrual_cycles: all own" on public.menstrual_cycles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.menstrual_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  pain_level smallint check (pain_level between 0 and 10),
  mood text,
  symptoms text[],
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);
alter table public.menstrual_daily_logs enable row level security;
create policy "menstrual_daily_logs: all own" on public.menstrual_daily_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- MEDICAL APPOINTMENTS
-- -------------------------------------------------------------------------
create table public.medical_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doctor_name text,
  specialty text,
  appointment_at timestamptz not null,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.medical_appointments enable row level security;
create policy "medical_appointments: all own" on public.medical_appointments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- STORAGE — bucket para fotos de refeições e avatar (privado, por usuário)
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Convenção de path: {user_id}/{filename}. As policies abaixo restringem
-- cada usuário à sua própria pasta dentro do bucket.
create policy "meal-photos: read own"
  on storage.objects for select
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "meal-photos: insert own"
  on storage.objects for insert
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "meal-photos: delete own"
  on storage.objects for delete
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: read own"
  on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: insert own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: update own"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================================
-- Fim da Fase 1. Tabelas futuras (workout_plans já modular, financas,
-- relacionamento, casa, trabalho, estudos, espiritualidade, metas) serão
-- adicionadas em migrations separadas, seguindo o mesmo padrão de
-- id/user_id/created_at/updated_at + RLS por auth.uid().
-- =========================================================================

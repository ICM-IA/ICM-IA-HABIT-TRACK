-- FOCUS: objetivos por mes + fecha de inicio + notas
-- Correr en Supabase (SQL Editor) una sola vez.

-- Fecha de inicio (1 fila por usuario) → ventana de 12 meses
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_year int not null,
  start_month int not null check (start_month between 1 and 12),
  updated_at timestamptz not null default now()
);

-- Meta por hábito y mes (solo overrides; si no hay fila se usa habits.goal)
create table if not exists public.habit_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  target int not null default 0 check (target >= 0),
  unique (habit_id, year, month)
);
create index if not exists habit_goals_user_idx on public.habit_goals (user_id, year, month);

-- Notas por mes
create table if not exists public.month_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  text text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, year, month)
);

-- RLS
alter table public.settings enable row level security;
alter table public.habit_goals enable row level security;
alter table public.month_notes enable row level security;

create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own habit_goals" on public.habit_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own month_notes" on public.month_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.habit_goals;
alter publication supabase_realtime add table public.month_notes;

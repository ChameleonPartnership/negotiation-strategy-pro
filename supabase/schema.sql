-- Negotiation Strategy Pro — Supabase Schema
-- Chameleon Partnership

-- Strategy projects
create table strategy_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  negotiation_for text,
  stakeholders text,
  draft_date date,
  sign_off text,
  start_date date,
  contingency_dates text,
  status text default 'in_progress', -- in_progress | complete
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 2: Initial Scoping
create table scoping (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  internal_stakeholders text,
  external_stakeholders text,
  preferred_approach text,
  our_outcomes text,
  their_outcomes text,
  main_issues text,
  created_at timestamptz default now()
);

-- Step 3: Orientation answers (12 questions, each Yes/No)
create table orientation (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  answers jsonb not null default '{}', -- {q1: "yes"/"no", q2: ...}
  result text, -- "cooperative" | "competitive"
  created_at timestamptz default now()
);

-- Step 4: Approach answers (6 statements, each Agree/Neither/Disagree)
create table approach (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  answers jsonb not null default '{}',
  result text, -- "share" | "create" | "give" | "take" | "protect"
  override text, -- manual override option
  created_at timestamptz default now()
);

-- Step 5: Power State (10 questions scored 0-10)
create table power_state (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  scores jsonb not null default '{}', -- {q1: 7, q2: 3, ...}
  total_score numeric,
  power_state text, -- recessive|passive|yielding|static|assertive|active|dominant
  created_at timestamptz default now()
);

-- Step 6: Strategy Selection
create table strategy_selection (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  answers jsonb not null default '{}',
  suggested_strategy text,
  final_strategy text,
  created_at timestamptz default now()
);

-- Scenarios (up to 3 per project)
create table scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null,
  scenario_number integer not null check (scenario_number between 1 and 3),
  name text,
  strategy text,
  unique(project_id, scenario_number)
);

-- Step 7: Strategic Phase Planner (one per scenario)
create table phase_planners (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios not null unique,
  phase_data jsonb not null default '{}',
  trigger_a text,
  trigger_b text,
  trigger_c text,
  trigger_d text,
  created_at timestamptz default now()
);

-- Step 8: Action Planners (5 per scenario)
create table action_planners (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios not null,
  planner_number integer not null check (planner_number between 1 and 5),
  strategy_label text,
  start_date date,
  phase_1 text,
  phase_2 text,
  phase_3 text,
  phase_4 text,
  phase_5 text,
  notes text,
  unique(scenario_id, planner_number)
);

-- Step 9: Potential Problem Analysis
create table ppa (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios not null,
  variant text not null check (variant in ('A','B','C','D')),
  rows jsonb not null default '[]',
  unique(scenario_id, variant)
);

-- Step 10: Triggers (per project)
create table triggers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  trigger_data jsonb not null default '{}',
  notes text
);

-- RLS Policies
alter table strategy_projects enable row level security;
alter table scoping enable row level security;
alter table orientation enable row level security;
alter table approach enable row level security;
alter table power_state enable row level security;
alter table strategy_selection enable row level security;
alter table scenarios enable row level security;
alter table phase_planners enable row level security;
alter table action_planners enable row level security;
alter table ppa enable row level security;
alter table triggers enable row level security;

-- strategy_projects: user owns
create policy "Users can manage own projects" on strategy_projects
  for all using (auth.uid() = user_id);

-- All child tables: access via project_id -> user_id
create policy "Users can manage own scoping" on scoping
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

create policy "Users can manage own orientation" on orientation
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

create policy "Users can manage own approach" on approach
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

create policy "Users can manage own power_state" on power_state
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

create policy "Users can manage own strategy_selection" on strategy_selection
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

create policy "Users can manage own scenarios" on scenarios
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

create policy "Users can manage own phase_planners" on phase_planners
  for all using (
    exists (
      select 1 from scenarios s
      join strategy_projects sp on sp.id = s.project_id
      where s.id = scenario_id and sp.user_id = auth.uid()
    )
  );

create policy "Users can manage own action_planners" on action_planners
  for all using (
    exists (
      select 1 from scenarios s
      join strategy_projects sp on sp.id = s.project_id
      where s.id = scenario_id and sp.user_id = auth.uid()
    )
  );

create policy "Users can manage own ppa" on ppa
  for all using (
    exists (
      select 1 from scenarios s
      join strategy_projects sp on sp.id = s.project_id
      where s.id = scenario_id and sp.user_id = auth.uid()
    )
  );

create policy "Users can manage own triggers" on triggers
  for all using (
    exists (select 1 from strategy_projects sp where sp.id = project_id and sp.user_id = auth.uid())
  );

-- Updated_at trigger for strategy_projects
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger strategy_projects_updated_at
  before update on strategy_projects
  for each row execute function update_updated_at();

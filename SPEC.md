# Negotiation Strategy Pro — Full Build Spec

## Product Overview
**Negotiation Strategy Pro (NSP)** is a standalone SaaS web app for Chameleon Partnership. It guides users through a structured decision-tree questionnaire to build a complete negotiation strategy, covering orientation, power state, strategy selection, phase planning, action planning, potential problem analysis, and contingency triggers.

It is the strategic counterpart to **Negotiation Navigator Pro (NNP)** (tactical tool at www.negotiation-navigator.pro). NSP should link to NNP from the dashboard.

---

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth + DB**: Supabase (email/password auth, PostgreSQL)
- **PDF Export**: react-pdf or @react-pdf/renderer for glossy professional PDF output
- **Deployment**: Vercel → strategy.chameleonpartnership.com
- **Repo**: New GitHub repo `negotiation-strategy-pro`

---

## Branding
- Brand: **Chameleon Partnership**
- Colour palette: match NNP — dark professional palette, teal/green accent (Chameleon brand)
- Logo: Use text "Negotiation Strategy Pro" with Chameleon Partnership sub-brand
- Tone: Professional, confident, premium B2B SaaS

---

## User Accounts & Data
- Supabase email/password auth
- Auto-confirm emails via SMTP already configured
- Each user can create multiple **Strategy Projects**
- Each Strategy Project contains up to **3 Scenarios**
- All data persists — users can return and edit at any stage
- Dashboard shows all user's strategy projects with status indicators

---

## App Architecture

### Pages / Routes
```
/                          → Marketing landing page
/auth/login                → Login
/auth/signup               → Signup
/dashboard                 → User dashboard (list of strategy projects)
/strategy/new              → Create new strategy project
/strategy/[id]             → Strategy overview/hub
/strategy/[id]/setup       → Step 1: Project Setup
/strategy/[id]/scoping     → Step 2: Initial Scoping
/strategy/[id]/orientation → Step 3: Orientation (Coop vs Competitive)
/strategy/[id]/approach    → Step 4: Approach Determination
/strategy/[id]/power       → Step 5: Power State Assessment
/strategy/[id]/strategy    → Step 6: Strategy Selection (based on power state)
/strategy/[id]/phases      → Step 7: Strategic Phase Planner (3 scenarios)
/strategy/[id]/actions     → Step 8: Action Planners (5 per scenario)
/strategy/[id]/ppa         → Step 9: Potential Problem Analysis (A-D per scenario)
/strategy/[id]/triggers    → Step 10: Contingency Triggers
/strategy/[id]/report      → Final Report + PDF Export
```

---

## Database Schema (Supabase)

```sql
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

-- Step 6: Strategy Selection (Agree/Indifferent/Disagree per power state questions)
create table strategy_selection (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  answers jsonb not null default '{}',
  suggested_strategy text,
  final_strategy text, -- may differ if overridden
  created_at timestamptz default now()
);

-- Scenarios (up to 3 per project)
create table scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null,
  scenario_number integer not null check (scenario_number between 1 and 3),
  name text,
  strategy text, -- which strategy applies to this scenario
  unique(project_id, scenario_number)
);

-- Step 7: Strategic Phase Planner (one per scenario)
create table phase_planners (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios not null unique,
  phase_data jsonb not null default '{}', -- flexible phase planning content
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
  strategy_label text, -- e.g. Capitulate, Compromise, Build, etc.
  start_date date,
  phase_1 text, -- preparation actions
  phase_2 text, -- opening actions
  phase_3 text, -- proposal actions
  phase_4 text, -- bargaining actions
  phase_5 text, -- closing actions
  notes text,
  unique(scenario_id, planner_number)
);

-- Step 9: Potential Problem Analysis (A, B, C, D per scenario)
create table ppa (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios not null,
  variant text not null check (variant in ('A','B','C','D')),
  rows jsonb not null default '[]', -- [{tactic, probability, seriousness, preventative_action, contingency_action}]
  unique(scenario_id, variant)
);

-- Step 10: Triggers (per project)
create table triggers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references strategy_projects not null unique,
  trigger_data jsonb not null default '{}', -- {trigger_1: {text, yes_no}, ...}
  notes text
);

-- RLS: users can only see their own data
alter table strategy_projects enable row level security;
-- (add similar RLS policies for all tables using project_id -> user_id join)
```

---

## Decision Tree Logic

### Step 3: Orientation — Cooperative or Competitive?
User answers Yes/No to 12 statements. The left column (Yes) points toward Cooperative; the right column (No) points toward Competitive. Majority determines result.

**Questions:**
1. Deadlock would be detrimental to both our interests
2. The outcome could benefit the other party
3. I want to achieve an 'all gain' outcome
4. I have a Long term mindset
5. There is mutual dependency
6. A state of trust exists or needs to exist
7. I want to avoid conflict
8. There is scope to be creative
9. I will work with rather than against
10. There is no need to be defensive
11. I can afford to be open with information
12. I believe they want to work with me / There are common interests and goals

**Result**: Count of Yes answers → majority = Cooperative; majority No = Competitive

---

### Step 4: Approach Determination
6 statements, each rated Agree / Neither / Disagree.

**Statements (same for both paths):**
1. I can afford to be demanding because they have few options
2. Our relationship does not require mutual trust
3. They depend on me
4. I will not require their co-operation for the contract to be fulfilled
5. Deadlock will have no real consequence to me
6. They will be open minded towards options

**Cooperative path results:**
- Majority Agree → SHARE (incremental value opportunities)
- Majority Neither → CREATE (value using power to demand cooperation)
- Majority Disagree → GIVE (create perception of give at minimum cost)

**Competitive path results:**
- Majority Agree → TAKE
- Majority Neither → PROTECT (interests whilst competitive)
- Majority Disagree → SHARE (incremental value via all gain)

User can also manually override the result.

---

### Step 5: Power State Assessment
10 questions, each scored 0–10 (slider or numeric input).
Score: 10 = strongly agree, 0 = strongly disagree.

**Questions:**
1. We have stronger BATNAs than they have
2. They think we have a stronger BATNA than they have
3. We have more time in which to negotiate
4. Time will increase the pressure on them
5. We are not dependent on them
6. They believe we are not dependent on them
7. We have more information about their circumstances
8. They imagine we have more information about their circumstances
9. The consequences of deadlock is greater to them
10. They perceive deadlock as having greater consequence to them

**Total score 0–100. Power states:**
- 0–14: **Recessive** (Submissive)
- 15–29: **Passive**
- 30–44: **Yielding**
- 45–55: **Static**
- 56–70: **Assertive**
- 71–85: **Active**
- 86–100: **Dominant** (Governing)

Note: If score is "Less power than your Orientation" — show a Re-evaluate warning.

---

### Step 6: Strategy Selection
Based on power state, user rates contextual statements (Agree / Indifferent / Disagree). System suggests optimal strategy. User can override.

**Recessive (4 statements) → Suggested: Capitulate**
1. I have no other options / no viable BATNA
2. Deadlock would be catastrophic for me
3. They cannot offer me any more value
4. There are no other variables I can trade with

**Passive (7 statements)**
1. They are able and willing to exercise their power
2. There would be little consequence to me in delaying progress
3. They are open-minded towards further proposals
4. I could say 'yes' to their demands, subject to new conditions
5. I cannot afford to avoid negotiating
6. I cannot escalate negotiations any further
7. They have fewer time pressures

**Yielding (5 statements)**
1. This is a new relationship with great potential
2. There would be little consequence to me in delaying progress
3. The other party will entertain trade-offs
4. There are a range of potential trade-offs available
5. I will need to invest proportionally more than them

**Static (8 statements)**
1. I have very few / non viable options
2. I cannot start to make firm unilateral demands
3. The level of trust is high
4. There are other variables I can trade with
5. We are close to forming an agreement
6. A warm relationship is needed
7. There would be little consequence to me in delaying progress
8. We are initiating this negotiation

**Assertive (5 statements)**
1. I cannot afford to exercise the power I have
2. A threat would not carry any weight and lose me credibility
3. There would be little consequence to me in delaying progress
4. Escalation would overcome their inertia
5. We are initiating this negotiation

**Active (8 statements)**
1. I am reacting to competitive action initiated by them
2. There would be little consequence to me in delaying progress
3. I can refer the negotiation to another party
4. An element of trust in the relationship is essential
5. I cannot afford to walk away from the deal
6. Walking away provides little leverage with other negotiations
7. I will suffer serious consequences of exploiting power now
8. We are initiating this negotiation

**Dominant (4 statements) → Suggested: Governing**
1. I would not carry out my threat
2. Exiting the relationship would be far worse for me than them
3. If I continue in this transaction I will not lose value
4. I have not used threats before

**Available strategies (9 total):**
Capitulate, Compromise, Build, Grow, Hold, Position, Caution, Impose, Exit

---

### Step 7: Strategic Phase Planner
Visual planner for each scenario (up to 3). User maps their strategic phases:
- Selected strategy shown as header
- Free-form phase planning grid
- 4 Trigger fields (A, B, C, D) — these link to the Triggers step

---

### Step 8: Action Planners (5 per scenario)
Each of the 5 action planners maps to a strategy sub-type. Has:
- Strategy label (Capitulate / Compromise / Build / etc.)
- Start date
- 5 phase columns: Preparation → Opening → Proposal → Bargaining → Closing
- Each phase has guided action text (pre-populated from strategy type) + user's own notes

**Pre-populated guidance by strategy:**

**Capitulate:**
- Preparation: Proactively exhibit behaviour that will show reluctance therefore give satisfaction
- Opening: Initiate concessions without making conditional demands and avoiding enthusiasm
- Proposal: Wait, receive and interpret response
- Bargaining: Acknowledge agreement, summarise and contract
- Closing: Use the movement to help in further negotiations through reciprocation

**Compromise:**
- Preparation: Shift perception of power and structure expectation through provision of information to strengthen your position
- Opening: Frame the negotiation by providing a pre-emptive firm extreme position
- Proposal: Initiate concessions without making conditional demands and avoiding enthusiasm
- Bargaining: Wait, receive and interpret response
- Closing: Acknowledge agreement, summarise and contract

---

### Step 9: PPA — Potential Problem Analysis
4 variants (A, B, C, D) per scenario. Each variant is a table with rows:
- **Tactics they may employ** (free text)
- **Probability** (Low / Medium / High)
- **Seriousness** (Low / Medium / High)
- **Preventative Actions** (free text)
- **Contingency Actions** (free text)

Users can add multiple rows per variant.

---

### Step 10: Contingency Triggers
10 standard triggers shown with Yes/No toggle. Notes field per trigger.

**Standard triggers:**
1. They are using delaying tactics
2. Discussions been escalated to a higher level
3. They have dis-empowered themselves
4. They have presented no alternatives
5. They have only presented win/lose proposals
6. They have introduced time related deadlines
7. They have formally withdrawn from discussions
8. They have rejected any attempt to create ongoing dialogue
9. They are demonstrating indifference/intransigence
10. They have introduced threats or deadlines

Note shown: *Ensure triggers are time related and are specific as possible as these will act as the prompt to adopt a change in your strategy.*

---

## Dashboard
- List of all strategy projects (card view)
- Each card shows: project name, negotiation for, status badge, last updated, % complete
- Quick actions: continue, view report, duplicate, delete
- CTA button to create new strategy
- Link/banner: "Need a tactical plan? → Negotiation Navigator Pro" (links to www.negotiation-navigator.pro)
- Progress indicator per project showing which steps are complete

---

## PDF Export (Glossy, Professional)
Full-page A4 PDF export containing:
1. Cover page: Negotiation Strategy Pro, project name, date, Chameleon Partnership branding
2. Project Setup summary
3. Orientation result with score
4. Approach result
5. Power State visual (gauge/meter showing score and state)
6. Selected Strategy
7. Strategic Phase Plan (all scenarios)
8. Action Plans summary
9. PPA tables
10. Triggers summary
11. Footer: Chameleon Partnership branding

Use @react-pdf/renderer for PDF generation. Style to match brand — dark header, clean tables, professional typography.

---

## Key UX Principles
- **Wizard-style flow**: progress bar at top showing which step user is on
- **Auto-save**: save on every input change (debounced)
- **Step gating**: can't proceed to next step without completing current (but can go back)
- **Mobile responsive** but optimised for desktop/tablet (this is a professional tool)
- **Visual results**: power state shown as a gauge/meter; orientation as a visual split

---

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_NNP_URL=https://www.negotiation-navigator.pro
NEXT_PUBLIC_APP_URL=https://strategy.chameleonpartnership.com
```

---

## Deployment
- Push to GitHub repo `negotiation-strategy-pro`
- Connect to Vercel
- Set environment variables in Vercel
- Domain: strategy.chameleonpartnership.com (DNS CNAME configured via Squarespace)
- Supabase project: create new project or use existing (ask Paul)

---

## Notes
- Supabase access token available at ~/.openclaw/.env as SUPABASE_ACCESS_TOKEN
- Existing Supabase projects: nzheissvcfuszwribkip (DealScript), zsoabbtcfgilyzkzegbw (NNP)
- Create a NEW Supabase project for NSP
- All logic is recreated from scratch (not copied) — this is Chameleon Partnership's own methodology

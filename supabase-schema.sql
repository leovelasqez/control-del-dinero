-- ============================================
-- ESQUEMA DE BASE DE DATOS - Control del Dinero
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. TRANSACCIONES
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('ingreso', 'gasto')),
  category text not null,
  description text not null default '',
  amount numeric(15,2) not null check (amount > 0),
  created_at timestamptz default now() not null
);

create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_date on public.transactions(user_id, date);

-- 2. PRESUPUESTOS
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  monthly_limit numeric(15,2) not null check (monthly_limit > 0),
  created_at timestamptz default now() not null,
  unique(user_id, category)
);

create index idx_budgets_user on public.budgets(user_id);

-- 3. METAS DE AHORRO
create table public.savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) not null default 0 check (current_amount >= 0),
  deadline date,
  created_at timestamptz default now() not null
);

create index idx_savings_goals_user on public.savings_goals(user_id);

-- 4. DEUDAS
create table public.debts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  original_amount numeric(15,2) not null check (original_amount > 0),
  current_balance numeric(15,2) not null check (current_balance >= 0),
  minimum_payment numeric(15,2) not null default 0,
  interest_rate numeric(5,2) not null default 0,
  created_at timestamptz default now() not null
);

create index idx_debts_user on public.debts(user_id);

-- 5. PAGOS DE DEUDAS (historial de abonos)
create table public.debt_payments (
  id uuid default gen_random_uuid() primary key,
  debt_id uuid references public.debts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(15,2) not null check (amount > 0),
  paid_at timestamptz default now() not null
);

create index idx_debt_payments_debt on public.debt_payments(debt_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve sus propios datos
-- ============================================

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

-- Políticas para transactions
create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions"
  on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions"
  on public.transactions for delete using (auth.uid() = user_id);

-- Políticas para budgets
create policy "Users can view own budgets"
  on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets"
  on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets"
  on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets"
  on public.budgets for delete using (auth.uid() = user_id);

-- Políticas para savings_goals
create policy "Users can view own savings_goals"
  on public.savings_goals for select using (auth.uid() = user_id);
create policy "Users can insert own savings_goals"
  on public.savings_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own savings_goals"
  on public.savings_goals for update using (auth.uid() = user_id);
create policy "Users can delete own savings_goals"
  on public.savings_goals for delete using (auth.uid() = user_id);

-- Políticas para debts
create policy "Users can view own debts"
  on public.debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts"
  on public.debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts"
  on public.debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts"
  on public.debts for delete using (auth.uid() = user_id);

-- Políticas para debt_payments
create policy "Users can view own debt_payments"
  on public.debt_payments for select using (auth.uid() = user_id);
create policy "Users can insert own debt_payments"
  on public.debt_payments for insert with check (auth.uid() = user_id);
create policy "Users can delete own debt_payments"
  on public.debt_payments for delete using (auth.uid() = user_id);

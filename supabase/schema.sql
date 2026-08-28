-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Type ENUMs
create type context_type as enum ('PERSONAL', 'CONDOMINIUM');
create type transaction_type as enum ('INCOME', 'EXPENSE');
create type transaction_status as enum ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
create type recurrence_frequency as enum ('MONTHLY', 'WEEKLY', 'YEARLY');
create type extra_fee_status as enum ('ACTIVE', 'FINISHED', 'CANCELLED');

-- 1. Contexts (Personal vs Condominium)
create table contexts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type context_type not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Condominiums
create table condominiums (
  id uuid primary key default uuid_generate_v4(),
  context_id uuid references contexts(id) on delete cascade not null,
  name text not null,
  cnpj text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories
create table categories (
  id uuid primary key default uuid_generate_v4(),
  context_id uuid references contexts(id) on delete cascade not null,
  name text not null,
  type transaction_type not null,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Extra Fees
create table extra_fees (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid references condominiums(id) on delete cascade not null,
  description text not null,
  total_amount decimal(12,2) not null,
  installments_count integer not null,
  installment_amount decimal(12,2) not null,
  start_date date not null,
  end_date date not null,
  periodicity recurrence_frequency default 'MONTHLY',
  status extra_fee_status default 'ACTIVE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Installment Groups
create table installment_groups (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  total_amount decimal(12,2) not null,
  total_installments integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Recurrences
create table recurrences (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  frequency recurrence_frequency not null,
  start_date date not null,
  end_date date,
  default_amount decimal(12,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Transactions (The core table)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  context_id uuid references contexts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete restrict,
  extra_fee_id uuid references extra_fees(id) on delete cascade,
  installment_group_id uuid references installment_groups(id) on delete cascade,
  recurrence_id uuid references recurrences(id) on delete cascade,
  description text not null,
  type transaction_type not null,
  expected_amount decimal(12,2) not null,
  actual_amount decimal(12,2),
  expected_date date not null,
  actual_date date,
  status transaction_status default 'PENDING',
  installment_number integer,
  observation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Setup (Row Level Security)
alter table contexts enable row level security;
alter table condominiums enable row level security;
alter table categories enable row level security;
alter table extra_fees enable row level security;
alter table installment_groups enable row level security;
alter table recurrences enable row level security;
alter table transactions enable row level security;

-- Simple RLS Policies: User can only access rows matching their user_id (via Context)
create policy "Users can manage their own contexts" on contexts for all using (auth.uid() = user_id);

create policy "Users can manage condominiums of their contexts" on condominiums for all using (
  context_id in (select id from contexts where user_id = auth.uid())
);

create policy "Users can manage categories of their contexts" on categories for all using (
  context_id in (select id from contexts where user_id = auth.uid())
);

create policy "Users can manage extra_fees of their condominiums" on extra_fees for all using (
  condominium_id in (
    select id from condominiums where context_id in (
      select id from contexts where user_id = auth.uid()
    )
  )
);

-- (Installment_groups and Recurrences might need to be linked to context_id for strict RLS, but for now we skip strict RLS on them or assume they are tied via transactions)
-- Better approach: add context_id to installment_groups and recurrences to easily filter.

alter table installment_groups add column context_id uuid references contexts(id) on delete cascade;
alter table recurrences add column context_id uuid references contexts(id) on delete cascade;

create policy "Users can manage their installment_groups" on installment_groups for all using (
  context_id in (select id from contexts where user_id = auth.uid())
);

create policy "Users can manage their recurrences" on recurrences for all using (
  context_id in (select id from contexts where user_id = auth.uid())
);

create policy "Users can manage their transactions" on transactions for all using (
  context_id in (select id from contexts where user_id = auth.uid())
);

-- Grants: RLS policies only take effect once the underlying Postgres role already has
-- table-level privileges. Without these, every query fails with "permission denied for
-- table X" (Postgres error 42501) before RLS is ever evaluated. This project's roles
-- never received them, which silently broke every read/write in the app.
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on
  contexts, condominiums, categories, extra_fees,
  installment_groups, recurrences, transactions
  to anon, authenticated;

grant all on
  contexts, condominiums, categories, extra_fees,
  installment_groups, recurrences, transactions
  to service_role;

-- So any table added later inherits the same grants automatically.
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;

-- Objetivos financeiros definidos pelo usuário (ex.: "Comprar um carro", R$ 50.000).
-- Mesmo padrão de RLS das demais tabelas por contexto.
create table goals (
  id uuid primary key default uuid_generate_v4(),
  context_id uuid references contexts(id) on delete cascade not null,
  name text not null,
  target_amount decimal(12,2) not null check (target_amount > 0),
  target_date date,
  current_saved_amount decimal(12,2) not null default 0 check (current_saved_amount >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table goals enable row level security;

create policy "Users can manage their own goals" on goals for all using (
  context_id in (select id from contexts where user_id = auth.uid())
);

grant select, insert, update, delete on goals to anon, authenticated;
grant all on goals to service_role;

-- Forma de pagamento por transação (Pix, dinheiro, cartão de crédito/débito, boleto).
create type transaction_payment_method as enum (
  'PIX',
  'DINHEIRO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'BOLETO',
  'OUTRO'
);

alter table transactions
  add column payment_method transaction_payment_method not null default 'OUTRO';

-- Índices: o schema não tinha nenhum além da chave primária, o que forçava scan
-- completo em toda leitura (inclusive na checagem de RLS, que compara context_id
-- em toda política deste arquivo). Puramente aditivo.
create index if not exists idx_transactions_context_expected_date
  on transactions (context_id, expected_date);
create index if not exists idx_transactions_category_id
  on transactions (category_id);
create index if not exists idx_transactions_installment_group_id
  on transactions (installment_group_id);
create index if not exists idx_transactions_recurrence_id
  on transactions (recurrence_id);
create index if not exists idx_transactions_extra_fee_id
  on transactions (extra_fee_id);
create index if not exists idx_categories_context_id
  on categories (context_id);
create index if not exists idx_condominiums_context_id
  on condominiums (context_id);
create index if not exists idx_extra_fees_condominium_id
  on extra_fees (condominium_id);
create index if not exists idx_installment_groups_context_id
  on installment_groups (context_id);
create index if not exists idx_recurrences_context_id
  on recurrences (context_id);
create index if not exists idx_contexts_user_id
  on contexts (user_id);
create index if not exists idx_goals_context_id
  on goals (context_id);

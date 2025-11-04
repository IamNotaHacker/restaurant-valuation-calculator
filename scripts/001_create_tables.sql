-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create calculations table to store user's valuation calculations
create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  calculation_name text not null,
  
  -- Input fields
  annual_revenue decimal(15, 2) not null,
  profit_margin decimal(5, 2) not null,
  growth_rate decimal(5, 2) not null,
  industry text not null,
  location text not null,
  years_in_business integer not null,
  employee_count integer not null,
  real_estate_owned boolean default false,
  franchise boolean default false,
  
  -- Calculated results
  ebitda decimal(15, 2),
  valuation_low decimal(15, 2),
  valuation_mid decimal(15, 2),
  valuation_high decimal(15, 2),
  multiple_used decimal(5, 2),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.calculations enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Calculations policies
create policy "calculations_select_own"
  on public.calculations for select
  using (auth.uid() = user_id);

create policy "calculations_insert_own"
  on public.calculations for insert
  with check (auth.uid() = user_id);

create policy "calculations_update_own"
  on public.calculations for update
  using (auth.uid() = user_id);

create policy "calculations_delete_own"
  on public.calculations for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists calculations_user_id_idx on public.calculations(user_id);
create index if not exists calculations_created_at_idx on public.calculations(created_at desc);

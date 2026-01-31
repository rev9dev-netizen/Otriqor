-- Create profiles table to store user preferences
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  preferences jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile" 
on public.profiles for select 
using ( auth.uid() = id );

-- Policy: Users can update their own profile
create policy "Users can update own profile" 
on public.profiles for update 
using ( auth.uid() = id );

-- Policy: Users can insert their own profile
create policy "Users can insert own profile" 
on public.profiles for insert 
with check ( auth.uid() = id );

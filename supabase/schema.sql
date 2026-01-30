-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Syncs with Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- CHATS
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text default 'New Chat',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- MESSAGES (Supports Tree Structure)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  parent_id uuid references messages(id), -- Points to previous message node
  model text, -- which model generated this (for analytics)
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;

create policy "Users can view own profiles" on profiles for select using (auth.uid() = id);
create policy "Users can update own profiles" on profiles for update using (auth.uid() = id);

create policy "Users can view own chats" on chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on chats for insert with check (auth.uid() = user_id);
create policy "Users can update own chats" on chats for update using (auth.uid() = user_id);
create policy "Users can delete own chats" on chats for delete using (auth.uid() = user_id);

create policy "Users can view messages of own chats" on messages for select using (
  exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
);
create policy "Users can insert messages to own chats" on messages for insert with check (
  exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
);

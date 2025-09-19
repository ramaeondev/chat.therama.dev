-- Profiles table
create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  email text unique,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Messages table
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- Policies for profiles
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow users to insert their own profile row
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Policies for messages
drop policy if exists "Users can view their conversations" on public.messages;
create policy "Users can view their conversations"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "Users can insert messages they send" on public.messages;
create policy "Users can insert messages they send"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

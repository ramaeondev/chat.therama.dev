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

-- Add messages table to the realtime publication
alter publication supabase_realtime add table public.messages;

-- Confirm table is in the publication
select * from pg_publication_tables where pubname = 'supabase_realtime';

-- Contacts table: stores explicit user contacts (friend-like) added via search
create table if not exists public.contacts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, contact_id)
);

alter table public.contacts enable row level security;

-- Policies for contacts
drop policy if exists "Users can view their contacts" on public.contacts;
create policy "Users can view their contacts"
  on public.contacts for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert their contacts" on public.contacts;
create policy "Users can insert their contacts"
  on public.contacts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their contacts" on public.contacts;
create policy "Users can delete their contacts"
  on public.contacts for delete
  to authenticated
  using (user_id = auth.uid());
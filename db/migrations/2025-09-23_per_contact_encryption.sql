-- Per-contact encryption migration (safe, non-destructive)
-- This migration adds:
-- 1) pgcrypto extension
-- 2) canonical conversation_id function
-- 3) generated conversation_id column on contacts + index
-- 4) conversation_keys table with RLS
-- 5) optional encryption columns on messages
-- 6) convenience view for derived conversation_id on messages

-- 1) Enable pgcrypto
create extension if not exists pgcrypto;

-- 2) Canonical conversation id function
drop function if exists public.canonical_conversation_id(uuid, uuid);
create function public.canonical_conversation_id(u1 uuid, u2 uuid)
returns text
language sql
stable
as $$
  select encode(
           digest(
             'conv:' || least(u1::text, u2::text) || ':' || greatest(u1::text, u2::text),
             'sha256'
           ),
           'hex'
         );
$$;

-- 3) Add generated conversation_id to contacts
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contacts' and column_name = 'conversation_id'
  ) then
    alter table public.contacts
      add column conversation_id text
        generated always as (public.canonical_conversation_id(user_id, contact_id)) stored;
    create index if not exists idx_contacts_conversation_id on public.contacts(conversation_id);
  end if;
end $$;

-- 4) Conversation keys table + RLS
create table if not exists public.conversation_keys (
  conversation_id text primary key,
  key_version int not null default 1,
  algorithm text not null default 'XChaCha20-Poly1305',
  e2ee boolean not null default true,
  wrapped_keys jsonb, -- [{device_id, recipient_user_id, wrap_alg, wrap_ciphertext, created_at}]
  created_by uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

alter table public.conversation_keys enable row level security;

drop policy if exists "Participants can view conversation keys" on public.conversation_keys;
create policy "Participants can view conversation keys"
  on public.conversation_keys for select
  to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.conversation_id = conversation_keys.conversation_id
        and (c.user_id = auth.uid() or c.contact_id = auth.uid())
    )
  );

drop policy if exists "Participants can insert conversation keys" on public.conversation_keys;
create policy "Participants can insert conversation keys"
  on public.conversation_keys for insert
  to authenticated
  with check (
    exists (
      select 1 from public.contacts c
      where c.conversation_id = conversation_keys.conversation_id
        and (c.user_id = auth.uid() or c.contact_id = auth.uid())
    ) and created_by = auth.uid()
  );

drop policy if exists "Participants can update conversation keys" on public.conversation_keys;
create policy "Participants can update conversation keys"
  on public.conversation_keys for update
  to authenticated
  using (
    exists (
      select 1 from public.contacts c
      where c.conversation_id = conversation_keys.conversation_id
        and (c.user_id = auth.uid() or c.contact_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.contacts c
      where c.conversation_id = conversation_keys.conversation_id
        and (c.user_id = auth.uid() or c.contact_id = auth.uid())
    )
  );

-- 5) Optional encryption columns for messages (non-destructive)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'key_version'
  ) then
    alter table public.messages add column key_version int;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'nonce'
  ) then
    alter table public.messages add column nonce bytea;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'aad'
  ) then
    alter table public.messages add column aad jsonb;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'ciphertext'
  ) then
    alter table public.messages add column ciphertext bytea;
  end if;
end $$;

-- 6) Convenience view (safe to drop/recreate)
drop view if exists public.v_messages_with_conversation;
create view public.v_messages_with_conversation as
  select m.*,
         public.canonical_conversation_id(m.sender_id, m.receiver_id) as conversation_id
  from public.messages m;

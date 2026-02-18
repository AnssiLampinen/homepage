-- Run this in your Supabase SQL Editor

-- 1. Create Rooms Table (Updated to use bigint/int8 id)
create table if not exists rooms (
  id bigint generated always as identity primary key, -- Use integer ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null
);

-- 2. Create Entries Table
create table if not exists entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  room_id bigint not null, -- Stores the ID from rooms table (integer)
  user_id text not null,
  current_song jsonb not null,
  favorite_song jsonb not null,
  underrated_song jsonb not null
);

-- Optional: Create an index for performance
create index if not exists entries_room_id_idx on entries (room_id);

-- Enable security policies
alter table rooms enable row level security;
alter table entries enable row level security;

-- Policies for Rooms
create policy "Enable read access for all users" on rooms for select using (true);
create policy "Enable insert access for all users" on rooms for insert with check (true);

-- Policies for Entries
create policy "Enable read access for all users" on entries for select using (true);
create policy "Enable insert access for all users" on entries for insert with check (true);

-- OPTIONAL: Insert the default room if it doesn't exist
-- Note: 'overriding system value' might be needed depending on your postgres version if inserting explicit ID into identity column
insert into rooms (id, name)
overriding system value
values (1, 'The Main Stage')
on conflict (id) do nothing;
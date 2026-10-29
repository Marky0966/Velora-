-- VELORA store — database setup. Supabase → SQL Editor → paste all → Run.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  items jsonb not null,
  address jsonb not null,
  subtotal numeric(12,2) not null,
  shipping numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  currency text not null,
  method text not null check (method in ('paypal','cod')),
  paypal_order_id text,
  status text not null default 'pending' check (status in ('pending','paid','packed','shipped','delivered','cancelled','refunded')),
  tracking text,
  created_at timestamptz not null default now()
);

create table if not exists admins (email text primary key);          -- store owner(s)
create table if not exists messages (id uuid primary key default gen_random_uuid(), name text not null, email text not null, message text not null check (char_length(message) between 5 and 2000), created_at timestamptz not null default now());
create table if not exists subscribers (email text primary key, created_at timestamptz not null default now());

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email')) $$;

alter table orders enable row level security;
alter table admins enable row level security;
alter table messages enable row level security;
alter table subscribers enable row level security;

-- orders: customers see/create only their own; owner sees/updates all
create policy "own orders read"   on orders for select using (user_id = auth.uid() or is_admin());
create policy "own orders insert" on orders for insert with check (user_id = auth.uid() and email = (auth.jwt() ->> 'email') and status in ('pending','paid'));
create policy "admin update"      on orders for update using (is_admin()) with check (is_admin());
-- admins table: a user can only see their own row (that's how the site knows they're the owner)
create policy "admin self read"   on admins for select using (lower(email) = lower(auth.jwt() ->> 'email'));
-- contact form + newsletter: anyone can submit; only owner can read
create policy "msg insert" on messages for insert with check (true);
create policy "msg admin read" on messages for select using (is_admin());
create policy "sub insert" on subscribers for insert with check (true);
create policy "sub admin read" on subscribers for select using (is_admin());

-- >>> After running this, make YOURSELF the owner (use the email you sign up with):
-- insert into admins (email) values ('you@example.com');

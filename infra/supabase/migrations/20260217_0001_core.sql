create table if not exists profiles (
  id uuid primary key,
  email text not null unique
);

create table if not exists carts (
  id uuid primary key,
  customer_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

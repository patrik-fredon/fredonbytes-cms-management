create table if not exists products (
  id uuid primary key,
  name text not null,
  price integer not null,
  created_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key,
  cart_id uuid not null references carts(id),
  variant_id text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key,
  code text not null unique,
  cart_id uuid not null references carts(id),
  status text not null default 'Created',
  created_at timestamptz not null default now()
);

create table if not exists cms_pages (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  body text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

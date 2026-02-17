insert into profiles (id, email)
values ('00000000-0000-0000-0000-000000000001', 'demo@example.com')
on conflict (id) do nothing;

insert into carts (id, customer_id)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into products (id, name, price)
values ('20000000-0000-0000-0000-000000000001', 'Demo Product', 2000)
on conflict (id) do nothing;

insert into cart_items (id, cart_id, variant_id, quantity, unit_price)
values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'variant-demo', 2, 2000)
on conflict (id) do nothing;

insert into orders (id, code, cart_id, status)
values ('40000000-0000-0000-0000-000000000001', 'ORD-00000001', '10000000-0000-0000-0000-000000000001', 'Created')
on conflict (id) do nothing;

insert into cms_pages (id, slug, title, body, published)
values ('50000000-0000-0000-0000-000000000001', 'home', 'Home', 'Welcome to FredonBytes', true)
on conflict (id) do nothing;

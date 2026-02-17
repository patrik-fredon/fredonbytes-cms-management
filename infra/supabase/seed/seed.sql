insert into profiles (id, email)
values ('00000000-0000-0000-0000-000000000001', 'demo@example.com')
on conflict (id) do nothing;

insert into carts (id, customer_id)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

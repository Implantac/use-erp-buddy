-- Suppliers Table
create table public.suppliers (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    name text not null,
    tax_id text,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone default now()
);

grant select, insert, update, delete on public.suppliers to authenticated;
grant all on public.suppliers to service_role;
alter table public.suppliers enable row level security;
create policy "Tenants can manage suppliers" on public.suppliers for all to authenticated using (tenant_id = (select current_setting('app.current_tenant_id', true)::uuid));

-- Purchase Orders Table
create table public.purchase_orders (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    supplier_id uuid references public.suppliers(id) on delete set null,
    status text not null default 'pending', -- pending, received, cancelled
    total_amount numeric default 0,
    created_at timestamp with time zone default now()
);

grant select, insert, update, delete on public.purchase_orders to authenticated;
grant all on public.purchase_orders to service_role;
alter table public.purchase_orders enable row level security;
create policy "Tenants can manage purchase_orders" on public.purchase_orders for all to authenticated using (tenant_id = (select current_setting('app.current_tenant_id', true)::uuid));

-- Purchase Items Table
create table public.purchase_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid references public.purchase_orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete restrict not null,
    quantity numeric not null,
    unit_price numeric not null,
    total_price numeric not null
);

grant select, insert, update, delete on public.purchase_items to authenticated;
grant all on public.purchase_items to service_role;
alter table public.purchase_items enable row level security;
create policy "Tenants can manage purchase_items" on public.purchase_items for all to authenticated using (exists (select 1 from public.purchase_orders where id = purchase_order_id and tenant_id = (select current_setting('app.current_tenant_id', true)::uuid)));

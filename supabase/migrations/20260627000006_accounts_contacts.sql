create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  industry text,
  company_size company_size,
  address text,
  state text,
  country text,
  website text,
  lead_source text,
  status account_status not null default 'lead',
  owner_id uuid references profiles(id),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index accounts_owner_idx on accounts (owner_id);
create index accounts_status_idx on accounts (status);
create index accounts_not_deleted_idx on accounts (id) where deleted_at is null;

create trigger set_updated_at before update on accounts
  for each row execute function set_updated_at();

alter table accounts enable row level security;

create policy accounts_select on accounts
  for select to authenticated
  using (is_admin() or current_user_role() in ('sales', 'finance'));

create policy accounts_write on accounts
  for all to authenticated
  using (is_admin() or current_user_role() = 'sales')
  with check (is_admin() or current_user_role() = 'sales');

create table contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  whatsapp text,
  linkedin_url text,
  preferences text,
  notes text,
  is_primary boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_account_idx on contacts (account_id);
create index contacts_not_deleted_idx on contacts (id) where deleted_at is null;

create trigger set_updated_at before update on contacts
  for each row execute function set_updated_at();

alter table contacts enable row level security;

create policy contacts_select on contacts
  for select to authenticated
  using (is_admin() or current_user_role() in ('sales', 'finance'));

create policy contacts_write on contacts
  for all to authenticated
  using (is_admin() or current_user_role() = 'sales')
  with check (is_admin() or current_user_role() = 'sales');

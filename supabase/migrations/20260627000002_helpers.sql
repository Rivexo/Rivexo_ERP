-- Generic updated_at trigger, reused by every table that has the column.
-- current_user_role()/is_admin() live in a later migration: they query `profiles`,
-- which must exist first (SQL-language functions are validated against the catalog at CREATE time).
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

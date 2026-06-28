-- Extensions
create extension if not exists pgcrypto;

-- Enums: fixed, stable sets only. Configurable business sets use lookup tables instead.
create type user_role as enum ('founder', 'partner', 'project_manager', 'sales', 'operations', 'finance');
create type account_status as enum ('lead', 'prospect', 'customer', 'inactive');
create type company_size as enum ('micro', 'small', 'medium', 'large');
create type payment_method as enum ('transferencia', 'tarjeta', 'efectivo', 'cheque', 'otro');
create type installment_status as enum ('pending', 'invoiced', 'paid');

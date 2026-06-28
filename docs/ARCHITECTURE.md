# Rivexo OS — Arquitectura Maestro

> Documento vivo. Generado en Fase 0 y mantenido conforme el sistema evoluciona. Cualquier cambio de modelo de datos, roles o convenciones debe reflejarse aquí.

## Contexto

Rivexo OS es el sistema operativo interno de Rivexo: centraliza CRM, Project Management y ERP en una sola base de datos, modelando el flujo real del negocio:

**Cuenta → Oportunidad (Deal) → Proyecto → Soporte**

Decisiones fundacionales:
- **App única Next.js** (App Router), sin monorepo.
- **Nombres de tablas/columnas en inglés**, UI en español.
- **Single-tenant**: una sola empresa (Rivexo) opera el sistema; RLS basada en rol + asignación de usuario, sin `organization_id`.
- Moneda única MXN, IVA configurable por deal (`iva_rate`, default 0.16).
- "Utilidad estimada" = margen bruto (precio − costo directo), **antes** de impuestos.

---

## 1. Stack técnico

| Capa | Elección | Por qué |
|---|---|---|
| Framework | Next.js (App Router), Server Components + Server Actions | Menos boilerplate de API routes, RSC reduce JS al cliente |
| DB / Auth | Supabase (Postgres + Supabase Auth + Storage) | RLS nativo en Postgres |
| Acceso a datos | Capa `services/*.service.ts` con `@supabase/ssr` tipado (`supabase gen types`), sin ORM adicional | Las migraciones SQL y RLS son la fuente de verdad |
| Validación | Zod (`lib/validations/*`), reutilizado en formularios (React Hook Form) y Server Actions | Una sola definición de esquema cliente+servidor |
| UI | Tailwind + shadcn/ui | — |
| Data fetching cliente | TanStack Query solo donde se necesite estado reactivo (Kanban, listas con filtros live) | El resto vía RSC |
| Vistas avanzadas | Kanban: `@dnd-kit`; Calendario: `react-big-calendar`; Gantt/Timeline: `gantt-task-react` | MIT, sin lock-in |
| Tipado | TypeScript estricto en todo el repo | — |

## 2. Convenciones

- DB: `snake_case`, inglés. TS: `camelCase` (bridge vía `supabase gen types typescript`).
- Toda tabla: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `updated_at timestamptz` (trigger `set_updated_at()`), `created_by uuid references profiles(id)`.
- **Soft delete**: `deleted_at timestamptz null` en tablas de negocio (accounts, contacts, deals, projects, tasks). Nunca `DELETE` físico salvo limpieza administrativa.
- Dinero: `numeric(14,2)`. Porcentajes: `numeric(5,2)`.
- Conjuntos **fijos y estables** (status de tarea, prioridad, rol) → `enum` Postgres. Conjuntos **configurables por el negocio** (etapas de pipeline, líneas de negocio, categorías de gasto) → tabla lookup editable desde Settings, nunca enum.
- Índices: en toda FK, en columnas de filtro frecuente (`status`, `stage_id`, `assignee_id`, `owner_id`, `project_id`), e índice parcial `where deleted_at is null`.

## 3. Modelo de datos

### 3.1 Identidad y roles

```
profiles (1:1 con auth.users)
  id uuid pk references auth.users
  full_name, email, avatar_url, phone
  role user_role_enum  -- founder | partner | project_manager | sales | operations | finance
  is_active boolean default true
```

`founder` y `partner` comparten el mismo nivel de acceso (total); se modelan como roles distintos solo por claridad organizacional.

### 3.2 CRM

```
business_lines        -- lookup: Deployments, Soporte, Mini Apps/Notion
  id, name, slug, is_active

pipeline_stages        -- lookup configurable, define el Kanban comercial
  id, name, order_index, is_won boolean, is_lost boolean, color

accounts
  id, name, legal_name, tax_id, industry, company_size,
  address, state, country, website,
  lead_source, status (lead|prospect|customer|inactive),
  owner_id -> profiles, notes,
  deleted_at, created_at, updated_at, created_by

contacts
  id, account_id -> accounts,
  full_name, job_title, email, phone, whatsapp, linkedin_url,
  preferences, notes, is_primary boolean,
  deleted_at, created_at, updated_at

deals
  id, name, account_id -> accounts, primary_contact_id -> contacts,
  business_line_id -> business_lines, owner_id -> profiles,
  stage_id -> pipeline_stages, probability int,
  expected_close_date date,
  price numeric(14,2) not null,              -- SIN IVA
  iva_rate numeric(5,4) default 0.16,
  payment_method payment_method_enum,
  deposit_percentage numeric(5,2),
  monthly_support_amount numeric(14,2),
  observations text,
  lost_reason text, closed_at timestamptz,
  deleted_at, created_at, updated_at, created_by

deal_financials          -- 1:1 con deals, AISLADA para ocultar costo/margen a Ventas
  deal_id -> deals (pk/fk)
  estimated_direct_cost numeric(14,2) not null
  -- iva_amount, total_with_iva, gross_margin, margin_pct, estimated_profit
  -- se calculan en la vista deal_financials_view (join + SELECT), no se duplican como columnas

deal_payment_installments   -- "pagos pactados" (incluye anticipo como primer registro)
  id, deal_id -> deals, label, due_date, amount,
  status (pending|invoiced|paid), paid_at
```

### 3.3 Conversión Deal → Proyecto

Botón "Convertir en Proyecto" (visible solo cuando `stage.is_won = true`) ejecuta una función Postgres `convert_deal_to_project(deal_id)` (transacción atómica) que:
1. Crea `projects` copiando cliente, línea de negocio, presupuesto (`price`) y costo (`estimated_direct_cost`).
2. Crea las 5 filas de `project_ideas_phases` (una por fase IDEAS).
3. Inserta en `activity_log`.

Invariante: `projects.account_id` y `projects.deal_id` son `not null`; `deal_id` con `unique` (un proyecto por deal). Nunca existe un proyecto sin cliente.

### 3.4 Project Management

```
projects
  id, deal_id -> deals (unique, not null), account_id -> accounts (not null),
  business_line_id -> business_lines,
  name, project_manager_id -> profiles,
  start_date, due_date, status (planning|active|on_hold|completed|cancelled),
  progress_pct numeric,
  deleted_at, created_at, updated_at, created_by

project_financials        -- 1:1, misma razón de aislamiento que deal_financials
  project_id -> projects (pk/fk)
  budget_sold numeric, direct_cost numeric

project_members           -- equipo (N:M)
  id, project_id, user_id -> profiles, role_in_project text

ideas_phases               -- lookup ESTÁTICA global: I, D, E, A, S
  id, code, name, order_index

project_ideas_phases        -- instancia de cada fase por proyecto
  id, project_id, phase_id -> ideas_phases,
  objectives text, status (not_started|in_progress|done|blocked),
  owner_id -> profiles, due_date

tasks
  id, project_id -> projects, ideas_phase_instance_id -> project_ideas_phases,
  parent_task_id -> tasks (self-ref, checklist anidado),
  title, description, assignee_id -> profiles,
  priority (low|medium|high|urgent), status (todo|in_progress|in_review|done|blocked),
  estimated_hours numeric, actual_hours numeric,
  due_date, position int,
  deleted_at, created_at, updated_at, created_by

task_dependencies
  id, task_id -> tasks, depends_on_task_id -> tasks, type (blocks|related)
```

### 3.5 Gestión estratégica

```
project_swot      -- id, project_id, type (strength|opportunity|weakness|threat), description, created_by
project_risks     -- id, project_id, description, impact (low|medium|high), probability (low|medium|high),
                      mitigation, owner_id -> profiles, status (open|mitigated|closed)
project_decisions -- id, project_id, title, description, decided_by -> profiles, decided_at, impact
```

### 3.6 Infraestructura transversal (evita sprawl de tablas)

```
comments   -- id, entity_type, entity_id, author_id, body, created_at, updated_at
files      -- id, entity_type, entity_id, bucket, path, file_name, mime_type, size_bytes, uploaded_by, created_at
links      -- id, entity_type, entity_id, url, label, created_by, created_at
activity_log -- id, entity_type, entity_id, action, actor_id, diff jsonb, description, created_at
```

`entity_type` + `entity_id` (índice compuesto) permiten adjuntar comentarios/archivos/links/historial a cualquier entidad sin tablas nuevas por módulo. Se introducen en Fase 2 cuando hay un consumidor real (tasks/proyectos).

### 3.7 ERP

```
expense_categories  -- lookup configurable: Nómina, Software, Renta, Internet, Contabilidad, Marketing, Otros...
  id, name, kind (fixed|variable), is_active

fixed_costs
  id, category_id -> expense_categories, name, amount,
  frequency (monthly|annual|one_time), effective_date, end_date, is_active, notes

variable_expenses
  id, project_id -> projects, category_id -> expense_categories,
  description, amount, expense_date

revenues             -- ingresos reales (cobrado), separado del plan de pagos del deal
  id, project_id -> projects, amount, received_at, payment_method,
  related_installment_id -> deal_payment_installments (nullable), notes

monthly_support_subscriptions   -- MRR
  id, account_id -> accounts, project_id -> projects (nullable),
  amount, billing_day int, status (active|paused|cancelled), start_date, end_date
```

**Preparado para crecer** (Fase 4): `support_invoices` (Cuentas por Cobrar de soporte), esquema contable doble-entrada (`chart_of_accounts`, `journal_entries`, `journal_lines`) para Estado de Resultados/Balance/Flujo de Efectivo.

### 3.8 Dashboards

Vistas SQL (`v_crm_pipeline_kpis`, `v_pm_project_kpis`, `v_erp_financial_summary`, `v_crm_dashboard`), nunca tablas nuevas. Se promueven a materializadas si el volumen lo requiere.

## 4. Roles y matriz de permisos

| Recurso | Founder/Socio | Ventas | Project Manager | Operación | Finanzas |
|---|---|---|---|---|---|
| Accounts/Contacts/Deals (operativo) | CRUD total | CRUD total | Lectura (sus proyectos) | — | Lectura |
| `deal_financials` / `project_financials` | CRUD | **Sin acceso** | Lectura (proyectos propios) | — | CRUD |
| Projects, Tasks, IDEAS, SWOT, Riesgos, Decisiones | CRUD total | — | CRUD (proyectos asignados) | Lectura+update de sus tareas | Lectura |
| ERP (costos, ingresos, soporte) | CRUD | — | — | — | CRUD |
| Settings | CRUD | — | — | — | — |

La restricción "Ventas nunca ve costo/utilidad/margen" se resuelve **a nivel de tabla**, no de columna: `estimated_direct_cost` y todo cálculo derivado viven en `deal_financials`/`project_financials`, tablas separadas con su propia política RLS. Es la forma nativa y robusta de lograr seguridad por columna en Postgres.

### Mecanismo RLS

```sql
create function current_role() returns user_role_enum
  language sql stable security definer
  as $$ select role from profiles where id = auth.uid() $$;

create function is_admin() returns boolean
  language sql stable
  as $$ select current_role() in ('founder','partner') $$;
```

Cada política sigue el patrón `using (is_admin() or <regla del rol>)`. Acceso por asignación (PM/Operación) vía `EXISTS` contra `project_members`/`tasks.assignee_id`/`projects.project_manager_id`. `profiles` tiene su propia política mínima (lectura de fila propia + admins leen todo) para evitar recursión.

## 5. Estructura de carpetas

```
rivexo-os/
  app/
    (auth)/login/
    (dashboard)/
      layout.tsx
      page.tsx
      crm/{accounts,contacts,deals/[id],pipeline}/
      projects/[id]/{tasks,ideas,gantt,swot,risks,decisions,history}/
      erp/{costs,revenues,support,reports}/
      settings/{roles,pipeline-stages,business-lines,expense-categories}/
  components/
    ui/            # shadcn primitives
    layout/        # Sidebar, Topbar, Breadcrumbs
    crm/ projects/ erp/
    shared/        # DataTable, KanbanBoard, GanttChart, CalendarView, CommentsPanel, FilesPanel, LinksPanel, HistoryTimeline
  hooks/
  lib/
    supabase/{client.ts,server.ts,middleware.ts}
    permissions.ts
    calculations.ts
    validations/
    utils.ts
  services/
  types/
    database.types.ts
    domain.ts
  supabase/
    migrations/
    seed.sql
  middleware.ts
```

## 6. Estrategia de escalabilidad

- Tablas polimórficas (`comments`, `files`, `links`, `activity_log`) → módulos nuevos no requieren tablas nuevas para estas funciones transversales.
- Lookups configurables (`pipeline_stages`, `business_lines`, `expense_categories`) → cambios de negocio sin migración.
- Columnas/vistas generadas → una sola fuente de verdad para todo número derivado, cero duplicación.
- Split financiero (`*_financials`) → seguridad por columna real.
- Soft delete + `activity_log` → auditoría completa, requerido por ERP.
- Índices en FKs + filtros frecuentes + parciales `where deleted_at is null`.
- Capa `services/` aísla a la UI de Supabase directo.
- Placeholders explícitos para Fase 4 (contabilidad doble-entrada) y futuras integraciones (IA, WhatsApp, correo, firma electrónica).

## 7. Plan de fases

- **Fase 0**: arquitectura, ERD, RLS, carpetas — sin código. ✅
- **Fase 1** (en curso): scaffold Next.js + Supabase, Auth, roles, layout/sidebar, dashboard CRM, CRUD de accounts/contacts/deals + Kanban de pipeline.
- **Fase 2**: conversión Deal→Proyecto, Project Management completo (IDEAS, tasks, Gantt/Calendario/Timeline, SWOT, riesgos, decisiones, historial).
- **Fase 3**: ERP (costos, ingresos, soporte/MRR) + dashboard financiero.
- **Fase 4**: estados financieros, reportes ejecutivos, automatizaciones.

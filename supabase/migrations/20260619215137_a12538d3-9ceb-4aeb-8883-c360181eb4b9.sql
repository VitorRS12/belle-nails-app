create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null default 'email',
  template text not null,
  recipient text not null,
  subject text,
  status text not null default 'sent',
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

grant select on public.notification_log to authenticated;
grant all on public.notification_log to service_role;

alter table public.notification_log enable row level security;

create policy "Members read own company notifications"
on public.notification_log for select to authenticated
using (
  company_id is not null
  and public.is_company_member(auth.uid(), company_id)
);

create index if not exists idx_notification_log_company on public.notification_log(company_id, created_at desc);
create index if not exists idx_notification_log_appt on public.notification_log(appointment_id);
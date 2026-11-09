-- Run once in the selected Supabase project's SQL editor.
create table if not exists public.vnpt_leads (
 id uuid primary key,
 created_at timestamptz not null default now(),
 full_name text not null check (char_length(full_name) between 2 and 80),
 phone text not null check (phone ~ '^0[35789][0-9]{8}$'),
 ward text not null,
 demand text not null,
 address text not null default '',
 utm jsonb not null default '{}',
 ip_hash text not null,
 consent_at timestamptz not null default now(),
 privacy_version text not null default '2026-11-09',
 status text not null default 'new' check (status in ('new','contacted','qualified','installed','closed')),
 assigned_to text,
 note text
);
create index if not exists vnpt_leads_created_idx on public.vnpt_leads(created_at desc);
create index if not exists vnpt_leads_rate_idx on public.vnpt_leads(ip_hash,created_at desc);
alter table public.vnpt_leads enable row level security;
revoke all on public.vnpt_leads from anon, authenticated;
grant all on public.vnpt_leads to service_role;

create or replace function public.submit_vnpt_lead(p_id uuid,p_ip_hash text,p_payload jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_ip_hash,0));
 if exists(select 1 from public.vnpt_leads where id=p_id) then return p_id; end if;
 if (select count(*) from public.vnpt_leads where ip_hash=p_ip_hash and created_at>now()-interval '15 minutes')>=5 then
   raise exception 'RATE_LIMIT';
 end if;
 insert into public.vnpt_leads(id,full_name,phone,ward,demand,address,utm,ip_hash)
 values(p_id,p_payload->>'full_name',p_payload->>'phone',p_payload->>'ward',p_payload->>'demand',coalesce(p_payload->>'address',''),coalesce(p_payload->'utm','{}'::jsonb),p_ip_hash);
 return p_id;
end $$;
revoke all on function public.submit_vnpt_lead(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_vnpt_lead(uuid,text,jsonb) to service_role;

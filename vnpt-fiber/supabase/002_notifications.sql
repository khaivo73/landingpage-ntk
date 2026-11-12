-- Hosted migration: vnpt_notification_outbox. No historic lead backfill.
create table public.vnpt_notification_outbox (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.vnpt_leads(id),
 channel text not null check(channel in ('telegram','email')),
 status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 lease_id uuid,
 lease_until timestamptz,
 sent_at timestamptz,
 last_error text,
 created_at timestamptz not null default now(),
 unique(lead_id,channel)
);
alter table public.vnpt_notification_outbox enable row level security;
revoke all on public.vnpt_notification_outbox from public, anon, authenticated;
grant all on public.vnpt_notification_outbox to service_role;
create index vnpt_notification_due on public.vnpt_notification_outbox(channel,next_attempt_at)
 where status in ('pending','sending');

create function public.enqueue_vnpt_notifications() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if new.status='new' and coalesce(new.utm->>'utm_source','') <>'system_qa' then
  insert into public.vnpt_notification_outbox(lead_id,channel)
  values(new.id,'telegram'),(new.id,'email') on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function public.enqueue_vnpt_notifications() from public, anon, authenticated;
grant execute on function public.enqueue_vnpt_notifications() to service_role;
create trigger vnpt_enqueue_notifications after insert on public.vnpt_leads
 for each row execute function public.enqueue_vnpt_notifications();

create function public.claim_vnpt_notification(p_channels text[]) returns setof jsonb
language sql security invoker set search_path = '' as $$
 with exhausted as (
  update public.vnpt_notification_outbox set status='failed',last_error='LEASE_EXPIRED',lease_id=null,lease_until=null
  where status='sending' and attempts>=12 and lease_until<=now() and channel=any(p_channels)
  returning id
 ), picked as (
  select o.id from public.vnpt_notification_outbox o
  join public.vnpt_leads l on l.id=o.lead_id
  where o.channel=any(p_channels) and o.channel in ('telegram','email')
   and o.status in ('pending','sending') and o.attempts<12
   and o.next_attempt_at<=now() and (o.lease_until is null or o.lease_until<=now())
   and l.status<>'closed'
  order by o.next_attempt_at,o.id limit 1 for update of o skip locked
 ), leased as (
  update public.vnpt_notification_outbox o
  set status='sending',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '2 minutes'
  from picked where o.id=picked.id returning o.*
 )
 select jsonb_build_object('id',o.id,'lease_id',o.lease_id,'lead_id',l.id,'channel',o.channel,
  'full_name',l.full_name,'phone',l.phone,'ward',l.ward,'demand',l.demand,'address',l.address,
  'created_at',l.created_at,'is_test',coalesce(l.utm->>'utm_source','')='delivery_qa')
 from leased o join public.vnpt_leads l on l.id=o.lead_id;
$$;
revoke all on function public.claim_vnpt_notification(text[]) from public, anon, authenticated;
grant execute on function public.claim_vnpt_notification(text[]) to service_role;

create function public.finish_vnpt_notification(p_id uuid,p_lease_id uuid,p_success boolean,p_error text default null,p_retry_seconds integer default 60)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
 update public.vnpt_notification_outbox
 set status=case when p_success then 'sent' when attempts>=12 then 'failed' else 'pending' end,
 sent_at=case when p_success then now() else null end,
 last_error=case when p_success then null else left(coalesce(p_error,'DELIVERY_FAILED'),60) end,
 next_attempt_at=now()+make_interval(secs=>greatest(60,least(86400,coalesce(p_retry_seconds,60)))),
 lease_until=null,lease_id=null
 where id=p_id and lease_id=p_lease_id and status='sending';
 get diagnostics affected=row_count;
 return affected=1;
end $$;
revoke all on function public.finish_vnpt_notification(uuid,uuid,boolean,text,integer) from public, anon, authenticated;
grant execute on function public.finish_vnpt_notification(uuid,uuid,boolean,text,integer) to service_role;

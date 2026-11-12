create or replace function public.claim_vnpt_notification(p_channels text[]) returns setof jsonb
language sql security invoker set search_path = '' as $$
 with exhausted as (
  update public.vnpt_notification_outbox set status='failed',last_error='LEASE_EXPIRED',lease_id=null,lease_until=null
  where status='sending' and attempts>=12 and lease_until<=now() and channel=any(p_channels)
  returning id
 ), picked as (
  select o.id from public.vnpt_notification_outbox o
  join public.vnpt_leads l on l.id=o.lead_id
  where o.channel=any(p_channels) and o.channel in ('telegram','email','google_sheets')
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
  'created_at',l.created_at,'is_test',coalesce(l.utm->>'utm_source','')='delivery_qa',
  'utm_source',coalesce(l.utm->>'utm_source',''),'utm_campaign',coalesce(l.utm->>'utm_campaign',''))
 from leased o join public.vnpt_leads l on l.id=o.lead_id;
$$;

create function public.vnpt_notification_pending_state(p_channels text[]) returns jsonb
language sql security invoker set search_path='' as $$
 select jsonb_build_object('pending',count(*),'next_due_at',min(greatest(o.next_attempt_at,coalesce(o.lease_until,o.next_attempt_at))))
 from public.vnpt_notification_outbox o join public.vnpt_leads l on l.id=o.lead_id
 where o.channel=any(p_channels) and o.channel in ('telegram','email','google_sheets')
 and o.status in ('pending','sending') and o.attempts<12 and l.status<>'closed';
$$;
revoke all on function public.vnpt_notification_pending_state(text[]) from public,anon,authenticated;
grant execute on function public.vnpt_notification_pending_state(text[]) to service_role;

alter table public.vnpt_notification_outbox drop constraint vnpt_notification_outbox_channel_check;
alter table public.vnpt_notification_outbox add constraint vnpt_notification_outbox_channel_check
 check(channel in ('telegram','email','google_sheets'));

create function public.enqueue_vnpt_sheet() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if new.status='new' and coalesce(new.utm->>'utm_source','')<>'system_qa' then
  insert into public.vnpt_notification_outbox(lead_id,channel) values(new.id,'google_sheets') on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function public.enqueue_vnpt_sheet() from public,anon,authenticated;
grant execute on function public.enqueue_vnpt_sheet() to service_role;
create trigger vnpt_enqueue_sheet after insert on public.vnpt_leads
 for each row execute function public.enqueue_vnpt_sheet();

create function public.claim_vnpt_sheet() returns setof jsonb
language sql security invoker set search_path='' as $$
 with exhausted as (
  update public.vnpt_notification_outbox set status='failed',last_error='LEASE_EXPIRED',lease_id=null,lease_until=null
  where status='sending' and attempts>=12 and lease_until<=now() and channel='google_sheets' returning id
 ), picked as (
  select o.id from public.vnpt_notification_outbox o join public.vnpt_leads l on l.id=o.lead_id
  where o.channel='google_sheets' and o.status in ('pending','sending') and o.attempts<12
   and o.next_attempt_at<=now() and (o.lease_until is null or o.lease_until<=now()) and l.status<>'closed'
  order by o.next_attempt_at,o.id limit 1 for update of o skip locked
 ), leased as (
  update public.vnpt_notification_outbox o set status='sending',attempts=attempts+1,
   lease_id=gen_random_uuid(),lease_until=now()+interval '2 minutes'
  from picked where o.id=picked.id returning o.*
 )
 select jsonb_build_object('id',o.id,'lease_id',o.lease_id,'lead_id',l.id,'full_name',l.full_name,
  'phone',l.phone,'ward',l.ward,'demand',l.demand,'address',l.address,'created_at',l.created_at,
  'is_test',coalesce(l.utm->>'utm_source','')='delivery_qa',
  'utm_source',coalesce(l.utm->>'utm_source',''),'utm_campaign',coalesce(l.utm->>'utm_campaign',''))
 from leased o join public.vnpt_leads l on l.id=o.lead_id;
$$;
revoke all on function public.claim_vnpt_sheet() from public,anon,authenticated;
grant execute on function public.claim_vnpt_sheet() to service_role;

create function public.finish_vnpt_sheet(p_id uuid,p_lease_id uuid,p_success boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.vnpt_notification_outbox where id=p_id and channel='google_sheets') then return false; end if;
 return public.finish_vnpt_notification(p_id,p_lease_id,p_success,'DELIVERY_FAILED',300);
end $$;
revoke all on function public.finish_vnpt_sheet(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.finish_vnpt_sheet(uuid,uuid,boolean) to service_role;

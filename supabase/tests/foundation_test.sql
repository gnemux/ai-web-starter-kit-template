begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(149);

select ok(c.relrowsecurity, format('%s has RLS enabled', expected.table_name))
from unnest(array['user_profiles','billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger','payment_events']) expected(table_name)
join pg_namespace n on n.nspname = 'public'
join pg_class c on c.relnamespace = n.oid and c.relname = expected.table_name;

select ok(exists (
  select 1 from pg_policies where schemaname = 'public' and tablename = expected.table_name
  and policyname = format('owner_read_%s', expected.table_name) and roles = '{authenticated}'::name[] and cmd = 'SELECT'
), format('%s has one authenticated owner-read policy', expected.table_name))
from unnest(array['user_profiles','billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) expected(table_name);

select ok(not has_table_privilege('anon', 'public.user_profiles', 'select'), 'anonymous cannot read profiles');
select ok(not has_table_privilege('authenticated', 'public.payment_events', 'select'), 'authenticated cannot read payment events');
select ok(has_table_privilege('service_role', 'public.payment_events', 'insert'), 'service role can insert payment events');
select ok(not has_function_privilege('authenticated', 'public.set_updated_at()', 'execute'), 'authenticated cannot execute trigger function');
select is((select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'payment_events'), 0::bigint, 'payment events expose no public policy');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('21000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','foundation-a@example.test','test',now(),'{}','{}',now(),now()),
  ('21000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','foundation-b@example.test','test',now(),'{}','{}',now(),now()),
  ('21000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','foundation-service@example.test','test',now(),'{}','{}',now(),now());

insert into public.user_profiles (id, display_name) values ('21000000-0000-0000-0000-000000000002', 'Owner B');
insert into public.billing_orders (id, owner_id, idempotency_key, plan_id, price_id, status, currency, amount_cents) values
  ('22000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','order:owner-a','starter','starter_month','paid','usd',100),
  ('22000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','order:owner-b','starter','starter_month','paid','usd',100);
insert into public.billing_subscriptions (id, owner_id, plan_id, price_id, status) values
  ('23000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','starter','starter_month','active'),
  ('23000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','starter','starter_month','active');
insert into public.billing_entitlements (id, owner_id, source_type, source_id, feature_key, allowance_kind, status) values
  ('24000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','subscription','23000000-0000-0000-0000-000000000001','feature_a','boolean','active'),
  ('24000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','subscription','23000000-0000-0000-0000-000000000002','feature_a','boolean','active');
insert into public.billing_credit_ledger (id, owner_id, entitlement_id, event_type, amount, unit, idempotency_key, source_type) values
  ('25000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','24000000-0000-0000-0000-000000000001','grant',1,'operation','credit:owner-a','subscription'),
  ('25000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','24000000-0000-0000-0000-000000000002','grant',1,'operation','credit:owner-b','subscription');
insert into public.billing_usage_ledger (id, owner_id, feature_key, units, unit, status, idempotency_key) values
  ('26000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','feature_a',1,'operation','committed','usage:owner-a'),
  ('26000000-0000-0000-0000-000000000002','21000000-0000-0000-0000-000000000002','feature_a',1,'operation','committed','usage:owner-b');
insert into public.payment_events (id, provider, event_id, event_type, idempotency_key) values
  ('27000000-0000-0000-0000-000000000001','sandbox','event-owner-a','checkout.completed','payment:owner-a');

select throws_ok($$delete from auth.users where id = '21000000-0000-0000-0000-000000000001'$$, '23503', null, 'auth user deletion cannot erase immutable billing facts');

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000001', true);

select lives_ok($$insert into public.user_profiles (id, display_name) values ('21000000-0000-0000-0000-000000000001','Owner A')$$, 'owner can insert own profile');
select throws_ok($$insert into public.user_profiles (id, display_name) values ('21000000-0000-0000-0000-000000000002','Blocked')$$, '42501', null, 'owner cannot insert another profile');
select is((select count(*)::bigint from public.user_profiles where id = '21000000-0000-0000-0000-000000000001'), 1::bigint, 'owner reads own profile');
select is((select count(*)::bigint from public.user_profiles where id = '21000000-0000-0000-0000-000000000002'), 0::bigint, 'owner cannot read another profile');
select lives_ok($$update public.user_profiles set display_name = 'Owner A updated' where id = '21000000-0000-0000-0000-000000000001'$$, 'owner can update own profile');
select throws_ok($$update public.user_profiles set id = '21000000-0000-0000-0000-000000000002' where id = '21000000-0000-0000-0000-000000000001'$$, '42501', null, 'owner cannot transfer profile ownership');
select throws_ok($$delete from public.user_profiles where id = '21000000-0000-0000-0000-000000000001'$$, '42501', null, 'authenticated profile delete is denied');

select is((select count(*)::bigint from public.billing_orders), 1::bigint, 'owner sees only own orders');
select is((select count(*)::bigint from public.billing_subscriptions), 1::bigint, 'owner sees only own subscriptions');
select is((select count(*)::bigint from public.billing_entitlements), 1::bigint, 'owner sees only own entitlements');
select is((select count(*)::bigint from public.billing_credit_ledger), 1::bigint, 'owner sees only own credit entries');
select is((select count(*)::bigint from public.billing_usage_ledger), 1::bigint, 'owner sees only own usage entries');
select is((select count(*)::bigint from public.user_profiles), 1::bigint, 'owner profile result is owner scoped');
select throws_ok($$insert into public.billing_orders (owner_id,idempotency_key,plan_id,price_id,status,currency,amount_cents) values ('21000000-0000-0000-0000-000000000001','blocked:insert','starter','starter_month','pending','usd',0)$$, '42501', null, 'authenticated billing insert is denied');
select throws_ok($$update public.billing_orders set status = 'refunded' where owner_id = '21000000-0000-0000-0000-000000000001'$$, '42501', null, 'authenticated billing update is denied');
select throws_ok($$delete from public.billing_orders where owner_id = '21000000-0000-0000-0000-000000000001'$$, '42501', null, 'authenticated billing delete is denied');
select throws_ok($$select count(*) from public.payment_events$$, '42501', null, 'authenticated payment event access is denied');
select throws_ok($$insert into public.payment_events default values$$, '42501', null, 'authenticated payment insert is denied');
select throws_ok($$update public.payment_events set id = id$$, '42501', null, 'authenticated payment update is denied');
select throws_ok($$delete from public.payment_events$$, '42501', null, 'authenticated payment delete is denied');

select throws_ok(format('insert into public.%I default values', table_name), '42501', null, format('owner A insert denied for %s', table_name))
from unnest(array['billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) table_name;
select throws_ok(format('update public.%I set id = id', table_name), '42501', null, format('owner A update denied for %s', table_name))
from unnest(array['billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) table_name;
select throws_ok(format('delete from public.%I', table_name), '42501', null, format('owner A delete denied for %s', table_name))
from unnest(array['billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) table_name;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-0000-0000-000000000002', true);
select is((select count(*)::bigint from public.user_profiles), 1::bigint, 'owner B sees only own profile');
select is((select count(*)::bigint from public.billing_orders), 1::bigint, 'owner B sees only own orders');
select is((select count(*)::bigint from public.billing_subscriptions), 1::bigint, 'owner B sees only own subscriptions');
select is((select count(*)::bigint from public.billing_entitlements), 1::bigint, 'owner B sees only own entitlements');
select is((select count(*)::bigint from public.billing_credit_ledger), 1::bigint, 'owner B sees only own credit entries');
select is((select count(*)::bigint from public.billing_usage_ledger), 1::bigint, 'owner B sees only own usage entries');
select is((select count(*)::bigint from public.user_profiles where id = '21000000-0000-0000-0000-000000000001'), 0::bigint, 'owner B cannot read owner A profile');
select is((select count(*)::bigint from public.billing_orders where owner_id = '21000000-0000-0000-0000-000000000001'), 0::bigint, 'owner B cannot read owner A orders');
select is((select count(*)::bigint from public.billing_subscriptions where owner_id = '21000000-0000-0000-0000-000000000001'), 0::bigint, 'owner B cannot read owner A subscriptions');
select is((select count(*)::bigint from public.billing_entitlements where owner_id = '21000000-0000-0000-0000-000000000001'), 0::bigint, 'owner B cannot read owner A entitlements');
select is((select count(*)::bigint from public.billing_credit_ledger where owner_id = '21000000-0000-0000-0000-000000000001'), 0::bigint, 'owner B cannot read owner A credit entries');
select is((select count(*)::bigint from public.billing_usage_ledger where owner_id = '21000000-0000-0000-0000-000000000001'), 0::bigint, 'owner B cannot read owner A usage entries');
select lives_ok($$update public.user_profiles set display_name = 'Owner B updated' where id = '21000000-0000-0000-0000-000000000002'$$, 'owner B can update own profile');
with changed as (
  update public.user_profiles
  set display_name = 'blocked'
  where id = '21000000-0000-0000-0000-000000000001'
  returning 1
)
select is((select count(*)::bigint from changed), 0::bigint, 'owner B cannot update owner A profile');
select throws_ok(format('insert into public.%I default values', table_name), '42501', null, format('owner B insert denied for %s', table_name))
from unnest(array['billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) table_name;
select throws_ok(format('update public.%I set id = id', table_name), '42501', null, format('owner B update denied for %s', table_name))
from unnest(array['billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) table_name;
select throws_ok(format('delete from public.%I', table_name), '42501', null, format('owner B delete denied for %s', table_name))
from unnest(array['billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger']) table_name;
select throws_ok($$select count(*) from public.payment_events$$, '42501', null, 'owner B payment select is denied');
select throws_ok($$insert into public.payment_events default values$$, '42501', null, 'owner B payment insert is denied');
select throws_ok($$update public.payment_events set id = id$$, '42501', null, 'owner B payment update is denied');
select throws_ok($$delete from public.payment_events$$, '42501', null, 'owner B payment delete is denied');

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select count(*) from public.user_profiles$$, '42501', null, 'anonymous profile access is denied');
select throws_ok(format('select count(*) from public.%I', table_name), '42501', null, format('anon select denied for %s', table_name))
from unnest(array['user_profiles','billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger','payment_events']) table_name;
select throws_ok(format('insert into public.%I default values', table_name), '42501', null, format('anon insert denied for %s', table_name))
from unnest(array['user_profiles','billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger','payment_events']) table_name;
select throws_ok(format('update public.%I set id = id', table_name), '42501', null, format('anon update denied for %s', table_name))
from unnest(array['user_profiles','billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger','payment_events']) table_name;
select throws_ok(format('delete from public.%I', table_name), '42501', null, format('anon delete denied for %s', table_name))
from unnest(array['user_profiles','billing_orders','billing_subscriptions','billing_entitlements','billing_credit_ledger','billing_usage_ledger','payment_events']) table_name;

reset role;
set local role service_role;
select lives_ok($$insert into public.payment_events (provider,event_id,event_type,idempotency_key) values ('sandbox','service-event','checkout.completed','payment:service')$$, 'service role can write payment events');
select throws_ok($$insert into public.payment_events (provider,event_id,event_type,idempotency_key) values ('sandbox','service-event-duplicate','checkout.completed','payment:service')$$, '23505', null, 'payment idempotency key rejects duplicates');
select lives_ok($$insert into public.user_profiles (id,display_name) values ('21000000-0000-0000-0000-000000000003','Service profile')$$, 'service inserts profile');
select lives_ok($$insert into public.billing_orders (id,owner_id,idempotency_key,plan_id,price_id,status,currency,amount_cents) values ('22000000-0000-0000-0000-000000000003','21000000-0000-0000-0000-000000000003','order:service','starter','starter_month','paid','usd',100)$$, 'service inserts order');
select lives_ok($$insert into public.billing_subscriptions (id,owner_id,plan_id,price_id,status) values ('23000000-0000-0000-0000-000000000003','21000000-0000-0000-0000-000000000003','starter','starter_month','active')$$, 'service inserts subscription');
select lives_ok($$insert into public.billing_entitlements (id,owner_id,source_type,source_id,feature_key,allowance_kind,status) values ('24000000-0000-0000-0000-000000000003','21000000-0000-0000-0000-000000000003','subscription','23000000-0000-0000-0000-000000000003','feature_a','boolean','active')$$, 'service inserts entitlement');
select lives_ok($$insert into public.billing_credit_ledger (id,owner_id,entitlement_id,event_type,amount,unit,idempotency_key,source_type) values ('25000000-0000-0000-0000-000000000003','21000000-0000-0000-0000-000000000003','24000000-0000-0000-0000-000000000003','grant',1,'operation','credit:service','subscription')$$, 'service inserts credit');
select lives_ok($$insert into public.billing_usage_ledger (id,owner_id,feature_key,units,unit,status,idempotency_key) values ('26000000-0000-0000-0000-000000000003','21000000-0000-0000-0000-000000000003','feature_a',1,'operation','committed','usage:service')$$, 'service inserts usage');
update public.billing_orders set provider_order_id = 'provider-order-service' where id = '22000000-0000-0000-0000-000000000003';
update public.billing_subscriptions set provider_subscription_id = 'provider-subscription-service' where id = '23000000-0000-0000-0000-000000000003';
select throws_ok($$insert into public.billing_orders (owner_id,idempotency_key,plan_id,price_id,status,currency,amount_cents) values ('21000000-0000-0000-0000-000000000003','order:service','starter','starter_month','paid','usd',100)$$, '23505', null, 'order idempotency key rejects duplicates');
select throws_ok($$insert into public.billing_orders (owner_id,provider,provider_order_id,idempotency_key,plan_id,price_id,status,currency,amount_cents) values ('21000000-0000-0000-0000-000000000003','sandbox','provider-order-service','order:provider-duplicate','starter','starter_month','paid','usd',100)$$, '23505', null, 'order provider identity rejects duplicates');
select throws_ok($$insert into public.billing_subscriptions (owner_id,provider,provider_subscription_id,plan_id,price_id,status) values ('21000000-0000-0000-0000-000000000003','sandbox','provider-subscription-service','starter','starter_month','active')$$, '23505', null, 'subscription provider identity rejects duplicates');
select throws_ok($$insert into public.billing_entitlements (owner_id,source_type,source_id,feature_key,allowance_kind,status) values ('21000000-0000-0000-0000-000000000003','subscription','23000000-0000-0000-0000-000000000003','feature_a','boolean','active')$$, '23505', null, 'entitlement source and feature identity rejects duplicates');
select throws_ok($$insert into public.billing_credit_ledger (owner_id,event_type,amount,unit,idempotency_key,source_type) values ('21000000-0000-0000-0000-000000000003','grant',1,'operation','credit:service','subscription')$$, '23505', null, 'credit idempotency key rejects duplicates');
select throws_ok($$insert into public.billing_usage_ledger (owner_id,feature_key,units,unit,status,idempotency_key) values ('21000000-0000-0000-0000-000000000003','feature_a',1,'operation','committed','usage:service')$$, '23505', null, 'usage idempotency key rejects duplicates');
select throws_ok($$insert into public.payment_events (provider,event_id,event_type,idempotency_key) values ('sandbox','service-event','checkout.completed','payment:provider-duplicate')$$, '23505', null, 'payment provider event identity rejects duplicates');
select is((select count(*)::bigint from public.user_profiles), 3::bigint, 'service reads all profiles');
select is((select count(*)::bigint from public.billing_orders), 3::bigint, 'service reads all orders');
select is((select count(*)::bigint from public.billing_subscriptions), 3::bigint, 'service reads all subscriptions');
select is((select count(*)::bigint from public.billing_entitlements), 3::bigint, 'service reads all entitlements');
select is((select count(*)::bigint from public.billing_credit_ledger), 3::bigint, 'service reads all credit entries');
select is((select count(*)::bigint from public.billing_usage_ledger), 3::bigint, 'service reads all usage entries');
select is((select count(*)::bigint from public.payment_events), 2::bigint, 'service reads all payment events');
select lives_ok($$update public.user_profiles set display_name = 'Service updated' where id = '21000000-0000-0000-0000-000000000003'$$, 'service updates profile');
select lives_ok($$update public.billing_orders set metadata = '{"checked":true}' where id = '22000000-0000-0000-0000-000000000003'$$, 'service updates order');
select lives_ok($$update public.billing_subscriptions set metadata = '{"checked":true}' where id = '23000000-0000-0000-0000-000000000003'$$, 'service updates subscription');
select lives_ok($$update public.billing_entitlements set metadata = '{"checked":true}' where id = '24000000-0000-0000-0000-000000000003'$$, 'service updates entitlement');
select lives_ok($$update public.billing_credit_ledger set metadata = '{"checked":true}' where id = '25000000-0000-0000-0000-000000000003'$$, 'service updates credit');
select lives_ok($$update public.billing_usage_ledger set metadata = '{"checked":true}' where id = '26000000-0000-0000-0000-000000000003'$$, 'service updates usage');
select lives_ok($$update public.payment_events set status = 'processed' where idempotency_key = 'payment:service'$$, 'service updates payment event');
select lives_ok($$delete from public.billing_usage_ledger where id = '26000000-0000-0000-0000-000000000003'$$, 'service deletes usage');
select lives_ok($$delete from public.billing_credit_ledger where id = '25000000-0000-0000-0000-000000000003'$$, 'service deletes credit');
select lives_ok($$delete from public.billing_entitlements where id = '24000000-0000-0000-0000-000000000003'$$, 'service deletes entitlement');
select lives_ok($$delete from public.billing_subscriptions where id = '23000000-0000-0000-0000-000000000003'$$, 'service deletes subscription');
select lives_ok($$delete from public.billing_orders where id = '22000000-0000-0000-0000-000000000003'$$, 'service deletes order');
select lives_ok($$delete from public.payment_events where idempotency_key = 'payment:service'$$, 'service deletes payment event');
select lives_ok($$delete from public.user_profiles where id = '21000000-0000-0000-0000-000000000003'$$, 'service deletes profile');

reset role;
select * from finish();
rollback;

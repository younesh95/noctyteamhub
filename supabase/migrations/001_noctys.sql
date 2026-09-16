-- NOCTYS · installation initiale. À exécuter une fois dans le SQL Editor Supabase.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check(username ~ '^[a-zA-Z0-9_-]{3,24}$'),
 role text not null default 'joueur' check(role in ('joueur','IGL','coach','analyste')),
 requested_role text not null default 'joueur' check(requested_role in ('joueur','IGL','coach','analyste')),
 active boolean not null default false,
 faceit text not null default '', steam_id text check(steam_id is null or steam_id='' or steam_id ~ '^[0-9]{17}$'),
 info text not null default '', avatar text, created_at timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles(lower(username));
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,username,faceit,requested_role) values(new.id,new.raw_user_meta_data->>'username',coalesce(new.raw_user_meta_data->>'faceit',''),coalesce(new.raw_user_meta_data->>'requested_role','joueur'));
 return new;
end;$$;
create trigger noctys_new_user after insert on auth.users for each row execute function public.handle_new_user();
create function public.is_member() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and active);$$;
create function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('coach','analyste'));$$;
create function public.can_schedule() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('coach','analyste','IGL'));$$;
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff() or public.is_member() and active);
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(faceit,steam_id,info,avatar) on public.profiles to authenticated;
create function public.approve_member(member_id uuid, approved_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_staff() then raise exception 'Staff requis'; end if;
 if approved_role not in ('joueur','IGL','coach','analyste') then raise exception 'Rôle invalide'; end if;
 update public.profiles set active=true,role=approved_role where id=member_id;
end;$$;
revoke all on function public.approve_member(uuid,text) from public,anon;
grant execute on function public.approve_member(uuid,text) to authenticated;
create table public.records (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('strat','roles','opponent','anti','dictionary','moves','macro-tips','micro-tips','gamesense','demo','personal-demo','event','chat')),
 title text not null check(length(title) between 1 and 150),body text not null default '' check(length(body)<=20000),
 map text,scope text not null default 'team' check(scope in ('team','personal')),
 owner_id uuid not null default auth.uid() references public.profiles(id),
 recipient_id uuid references public.profiles(id),data jsonb not null default '{}' check(jsonb_typeof(data)='object'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((kind='personal-demo' and scope='personal') or kind<>'personal-demo'),
 check(kind not in ('strat','roles','opponent','anti','dictionary','moves','macro-tips','micro-tips','gamesense','demo') or scope='team'),
 check(kind<>'chat' or (scope='personal' and recipient_id is not null and recipient_id<>owner_id) or (scope='team' and recipient_id is null))
);
create index records_kind_time on public.records(kind,created_at desc);
create index records_owner on public.records(owner_id);
create index records_recipient on public.records(recipient_id);
create unique index records_map_roles on public.records(map) where kind='roles';
alter table public.records enable row level security;
create policy records_read on public.records for select to authenticated using(public.is_member() and (scope='team' or owner_id=auth.uid() or recipient_id=auth.uid()));
create policy records_insert on public.records for insert to authenticated with check(public.is_member() and owner_id=auth.uid() and (
 (scope='personal' and kind in ('event','personal-demo','chat')) or
 (scope='team' and (kind='chat' or kind='event' and public.can_schedule() or kind<>'chat' and public.is_staff()))
) and (recipient_id is null or exists(select 1 from public.profiles p where p.id=recipient_id and p.active)));
create policy records_update on public.records for update to authenticated using(public.is_member() and (
 scope='personal' and owner_id=auth.uid() or scope='team' and (kind='event' and public.can_schedule() or public.is_staff() or kind='chat' and owner_id=auth.uid())
)) with check(public.is_member() and (scope='personal' and owner_id=auth.uid() or scope='team' and (kind='event' and public.can_schedule() or public.is_staff() or kind='chat' and owner_id=auth.uid())));
create policy records_delete on public.records for delete to authenticated using(public.is_member() and (scope='personal' and owner_id=auth.uid() or scope='team' and (kind='event' and public.can_schedule() or public.is_staff() or kind='chat' and owner_id=auth.uid())));
grant select,insert,update,delete on public.records to authenticated;
revoke all on public.records from anon;
create function public.validate_record() returns trigger language plpgsql set search_path='' as $$
declare a jsonb; roles jsonb; side_name text; value text; count_all integer; count_unique integer;
begin
 if TG_OP='UPDATE' and (new.owner_id<>old.owner_id or new.scope<>old.scope or new.kind<>old.kind or new.recipient_id is distinct from old.recipient_id or new.created_at<>old.created_at) then raise exception 'Identité du contenu immuable'; end if;
 new.updated_at=now();
 if new.kind='event' then
  if new.data->>'start' is null or new.data->>'end' is null or (new.data->>'end')::timestamptz <= (new.data->>'start')::timestamptz then raise exception 'Période invalide'; end if;
 end if;
 if new.kind='strat' then
  if new.map is null or new.map='' then raise exception 'Map requise'; end if;
  if coalesce(new.data->>'side','') not in ('T','CT') or coalesce(new.data->>'buy','') not in ('Eco buy','Pistol','Force buy','Full buy') or coalesce(new.data->>'type','') not in ('Selon les rôles','Selon les spawns') then raise exception 'Stratégie invalide'; end if;
  for a in select * from jsonb_array_elements(new.data->'actions') loop
   if (a->>'start')::int not between 5 and 135 or (a->>'end')::int not between 5 and 135 or (a->>'end')::int>(a->>'start')::int or coalesce(a->>'text','')='' or coalesce(a->>'player','')='' then raise exception 'Action invalide'; end if;
  end loop;
 end if;
 if new.kind='roles' then
  foreach side_name in array array['T','CT'] loop
   roles=coalesce(new.data->side_name,'{}'::jsonb);
   select count(*),count(distinct v) into count_all,count_unique from jsonb_each_text(roles) as t(k,v) where v<>'';
   if count_all<>count_unique then raise exception 'Rôles dupliqués sur ce side'; end if;
   for value in select v from jsonb_each_text(roles) as t(k,v) where v<>'' loop
    if side_name='T' and value not in ('Entry','Support','Lurker','AWP','IGL','Trader') or side_name='CT' and value not in ('B','AWP fixe','A fixe','Mid player','Anchor','B rotation','A rotation') then raise exception 'Rôle tactique invalide'; end if;
   end loop;
  end loop;
 end if;
 return new;
end;$$;
create trigger validate_record before insert or update on public.records for each row execute function public.validate_record();
-- Private files: owner upload; access follows a readable record referencing the file.
insert into storage.buckets(id,name,public,file_size_limit) values('team-files','team-files',false,524288000);
create policy file_upload on storage.objects for insert to authenticated with check(bucket_id='team-files' and public.is_member() and (storage.foldername(name))[1]=auth.uid()::text);
create policy file_read on storage.objects for select to authenticated using(bucket_id='team-files' and public.is_member() and (
 (storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.records r where r.data->>'file'=name) or exists(select 1 from public.profiles p where p.avatar=name and p.active)
));
create policy file_delete on storage.objects for delete to authenticated using(bucket_id='team-files' and public.is_member() and (storage.foldername(name))[1]=auth.uid()::text);
alter publication supabase_realtime add table public.records;
-- Login helper: callable only by the edge function's service role. Never exposed to anon.
create function public.login_email(login_username text) returns text language sql stable security definer set search_path='' as $$select u.email from auth.users u join public.profiles p on p.id=u.id where lower(p.username)=lower(login_username) limit 1;$$;
revoke all on function public.login_email(text) from public,anon,authenticated;
grant execute on function public.login_email(text) to service_role;
create table public.login_limits(key text primary key,attempts int not null,window_start timestamptz not null);
alter table public.login_limits enable row level security;
revoke all on public.login_limits from anon,authenticated;
create function public.login_rate_limit(rate_key text) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.login_limits(key,attempts,window_start) values(rate_key,1,now()) on conflict(key) do update set attempts=case when login_limits.window_start<now()-interval '10 minutes' then 1 else login_limits.attempts+1 end,window_start=case when login_limits.window_start<now()-interval '10 minutes' then now() else login_limits.window_start end returning attempts into n;
 return n<=10;
end;$$;
revoke all on function public.login_rate_limit(text) from public,anon,authenticated;
grant execute on function public.login_rate_limit(text) to service_role;
commit;

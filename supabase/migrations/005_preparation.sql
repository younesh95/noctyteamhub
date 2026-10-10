-- Apply once after 004. Adds match availability and a single team presentation.
begin;
create table public.match_availability (
 event_id uuid not null references public.records(id) on delete cascade,
 profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 status text not null check(status in ('Disponible','Incertain','Absent')),
 primary key(event_id,profile_id)
);
alter table public.match_availability enable row level security;
revoke all on public.match_availability from anon,authenticated;
grant select,insert,update,delete on public.match_availability to authenticated;
create policy availability_read on public.match_availability for select to authenticated using(public.is_member());
create policy availability_insert on public.match_availability for insert to authenticated with check(public.is_member() and profile_id=auth.uid() and exists(select 1 from public.records where id=event_id and kind='event' and scope='team'));
create policy availability_update on public.match_availability for update to authenticated using(public.is_member() and profile_id=auth.uid()) with check(public.is_member() and profile_id=auth.uid() and exists(select 1 from public.records where id=event_id and kind='event' and scope='team'));
create policy availability_delete on public.match_availability for delete to authenticated using(public.is_member() and profile_id=auth.uid());
create table public.board_live (
 id text primary key check(id='team'),
 presenter_id uuid not null references public.profiles(id) on delete cascade,
 state jsonb not null check(jsonb_typeof(state)='object' and octet_length(state::text)<=1000000),
 updated_at timestamptz not null default now()
);
alter table public.board_live enable row level security;
revoke all on public.board_live from anon,authenticated;
grant select on public.board_live to authenticated;
create policy live_read on public.board_live for select to authenticated using(public.is_member());
create function public.present_board(frame jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 if not public.is_staff() then raise exception 'Staff requis'; end if;
 if frame is null then delete from public.board_live where id='team' and presenter_id=auth.uid();return true;end if;
 if jsonb_typeof(frame) is distinct from 'object' or jsonb_typeof(frame->'plan'->'marks') is distinct from 'array' or octet_length(frame::text)>1000000 then raise exception 'Présentation invalide';end if;
 if jsonb_array_length(frame->'plan'->'marks')>500 then raise exception 'Trop de repères';end if;
 insert into public.board_live(id,presenter_id,state) values('team',auth.uid(),frame)
 on conflict(id) do update set presenter_id=excluded.presenter_id,state=excluded.state,updated_at=now()
 where board_live.presenter_id=auth.uid() or board_live.updated_at<now()-interval '20 seconds';
 get diagnostics affected=row_count;
 return affected=1;
end;$$;
revoke all on function public.present_board(jsonb) from public,anon;
grant execute on function public.present_board(jsonb) to authenticated;
create function public.validate_match_lineup() returns trigger language plpgsql set search_path='' as $$
declare v text; ids text[]='{}'; side_name text; assigned jsonb;
begin
 if new.kind='event' and new.data ? 'lineup' then
  if new.scope<>'team' or jsonb_typeof(new.data->'lineup') is distinct from 'array' then raise exception 'Composition invalide';end if;
  if jsonb_array_length(new.data->'lineup')<>5 then raise exception 'Cinq titulaires requis';end if;
  for v in select jsonb_array_elements_text(new.data->'lineup') loop
   if v=any(ids) or not exists(select 1 from public.records r cross join lateral jsonb_array_elements(r.data->'slots') s where r.kind='roster' and s->>'id'=v) then raise exception 'Joueur hors effectif ou dupliqué';end if;
   ids=array_append(ids,v);
  end loop;
  if new.data ? 'lineupRoles' then
   foreach side_name in array array['T','CT'] loop
    assigned=new.data->'lineupRoles'->side_name;
    if jsonb_typeof(assigned) is distinct from 'object' then raise exception 'Rôles de match invalides';end if;
    if exists(select 1 from jsonb_each_text(assigned) x where x.key<>all(ids)) then raise exception 'Rôle hors composition';end if;
    if (select count(*)<>count(distinct value) from jsonb_each_text(assigned) where value<>'') then raise exception 'Rôles de match dupliqués';end if;
    for v in select value from jsonb_each_text(assigned) where value<>'' loop
     if side_name='T' and v not in ('Entry','Support','Lurker','AWP','IGL','Trader') or side_name='CT' and v not in ('B','AWP fixe','A fixe','Mid player','Anchor','B rotation','A rotation') then raise exception 'Rôle de match inconnu';end if;
    end loop;
   end loop;
  end if;
 end if;
 return new;
end;$$;
create trigger validate_match_lineup before insert or update on public.records for each row execute function public.validate_match_lineup();
commit;

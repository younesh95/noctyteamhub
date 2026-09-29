-- Run once after 001 and 002. No Auth accounts are created by this migration.
begin;
alter table public.records drop constraint records_kind_check;
alter table public.records add constraint records_kind_check check(kind in ('strat','board','roles','roster','veto','call','opponent','anti','dictionary','moves','macro-tips','micro-tips','gamesense','demo','personal-demo','event','chat'));
alter table public.records add constraint team_tools_scope check(kind not in ('roster','veto','call') or scope='team');
create unique index records_one_roster on public.records(kind) where kind='roster';
-- Existing RLS: active members read, coach/analyst write. No new privilege grants.
create function public.validate_team_tools() returns trigger language plpgsql set search_path='' as $$
declare slot jsonb; slot_ids text[]='{}'; profile_ids text[]='{}'; profile_id text;
begin
 if new.kind='roster' then
  if jsonb_typeof(new.data->'slots') is distinct from 'array' then raise exception 'Effectif invalide'; end if;
  if jsonb_array_length(new.data->'slots')<>7 then raise exception 'Sept emplacements requis'; end if;
  for slot in select * from jsonb_array_elements(new.data->'slots') loop
   if coalesce(slot->>'id','')='' or coalesce(trim(slot->>'name'),'')='' or length(slot->>'name')>40 or (slot->>'id')=any(slot_ids) then raise exception 'Emplacement invalide ou dupliqué'; end if;
   slot_ids=array_append(slot_ids,slot->>'id');
   profile_id=coalesce(slot->>'profileId','');
   if profile_id<>'' then
    if profile_id=any(profile_ids) or not exists(select 1 from public.profiles where id::text=profile_id and active and role in ('joueur','IGL')) then raise exception 'Compte joueur invalide ou déjà associé'; end if;
    profile_ids=array_append(profile_ids,profile_id);
   end if;
  end loop;
 end if;
 if new.kind='call' and coalesce(new.data->>'room','') !~ '^noctys-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then raise exception 'Salon Jitsi invalide'; end if;
 return new;
end;$$;
create trigger validate_team_tools before insert or update on public.records for each row execute function public.validate_team_tools();
commit;

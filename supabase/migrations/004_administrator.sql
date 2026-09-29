-- Apply after 003. Adds an application administrator, never a Supabase service role.
begin;
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('joueur','IGL','coach','analyste','admin'));
-- requested_role deliberately excludes admin: public signup cannot request it.
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('coach','analyste','admin'));
$$;
create or replace function public.can_schedule() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active and role in ('coach','analyste','IGL','admin'));
$$;
create or replace function public.approve_member(member_id uuid, approved_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_staff() then raise exception 'Staff requis'; end if;
 -- Administrator provisioning stays in the SQL Editor; coaches cannot promote/demote admins.
 if approved_role not in ('joueur','IGL','coach','analyste') or approved_role is null then raise exception 'Rôle invalide'; end if;
 if exists(select 1 from public.profiles where id=member_id and role='admin') then raise exception 'Compte administrateur protégé'; end if;
 update public.profiles set active=true,role=approved_role where id=member_id;
 if not found then raise exception 'Membre introuvable'; end if;
end;$$;
revoke all on function public.approve_member(uuid,text) from public,anon;
grant execute on function public.approve_member(uuid,text) to authenticated;
commit;

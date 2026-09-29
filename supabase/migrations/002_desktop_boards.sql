-- Apply once after 001. Existing data and policies remain intact.
begin;
alter table public.records drop constraint records_kind_check;
alter table public.records add constraint records_kind_check check(kind in ('strat','board','roles','opponent','anti','dictionary','moves','macro-tips','micro-tips','gamesense','demo','personal-demo','event','chat'));
alter table public.records add constraint board_team_only check(kind<>'board' or scope='team');
-- Existing records policies already reserve team content writes to coach/analyst.
-- Bucket remains private; downloads use signed URLs after membership checks.
update storage.buckets set public=false,file_size_limit=524288000 where id='team-files';
commit;

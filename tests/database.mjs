import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;grant usage on schema public,auth to authenticated,anon;`);
let sql=fs.readFileSync('supabase/migrations/001_noctys.sql','utf8').replace('alter publication supabase_realtime add table public.records;','');await db.exec(sql);await db.exec(fs.readFileSync('supabase/migrations/002_desktop_boards.sql','utf8'));console.log('Migration SQL: PASS (Supabase auth/storage mocked; realtime publication excluded)');
const ids=['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003'];
for(let i=0;i<3;i++)await db.query('insert into auth.users values($1,$2,$3)',[ids[i],`p${i}@example.com`,JSON.stringify({username:'player'+i,requested_role:'coach'})]);
for(let i=3;i<9;i++)await db.query('insert into auth.users values($1,$2,$3)',[`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,`p${i}@example.com`,JSON.stringify({username:'player'+i,requested_role:'joueur'})]);
if((await db.query('select count(*)::int as total from public.profiles')).rows[0].total!==9)throw Error('Nine signups failed');
try{await db.query('insert into auth.users values($1,$2,$3)',['00000000-0000-0000-0000-000000000010','duplicate@example.com',JSON.stringify({username:'PLAYER1',requested_role:'joueur'})]);throw Error('Duplicate username accepted')}catch(e){if(e.message==='Duplicate username accepted')throw e;}
console.log('Nine distinct accounts and case-insensitive username uniqueness: PASS');
const a=await db.query('select role,active from public.profiles');if(a.rows.some(p=>p.role!=='joueur'||p.active))throw Error('Escalation on signup');console.log('Signup does not grant privileged roles: PASS');
await db.query("update public.profiles set active=true,role=case when id=$1 then 'coach' else 'joueur' end",[ids[0]]);
await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${ids[1]}',false);`);
async function reject(label,query){try{await db.exec(query);throw Error('UNEXPECTED SUCCESS '+label)}catch(e){if(e.message.includes('UNEXPECTED'))throw e;console.log(label+': PASS')}}
await reject('Player cannot self-promote',"update public.profiles set role='coach'");
await reject('Player cannot approve member',`select public.approve_member('${ids[2]}','coach')`);
await reject('Player cannot create team event',`insert into public.records(kind,title,data) values('event','test','{"start":"2026-09-14T20:00:00Z","end":"2026-09-14T21:00:00Z"}')`);
await db.exec(`insert into public.records(kind,title,scope,data) values('event','private','personal','{"start":"2026-09-14T20:00:00Z","end":"2026-09-14T21:00:00Z"}');`);
await db.exec(`select set_config('request.jwt.claim.sub','${ids[2]}',false);`);const privateRows=await db.query("select * from public.records where title='private'");if(privateRows.rows.length)throw Error('Private data leak');console.log('Personal events isolated: PASS');
await db.exec(`select set_config('request.jwt.claim.sub','${ids[0]}',false);`);
await db.query('select public.approve_member($1,$2)',[ids[2],'joueur']);
if(!(await db.query('select active from public.profiles where id=$1',[ids[2]])).rows[0].active)throw Error('Staff approval failed');
console.log('Staff activates a pending account: PASS');
await reject('Duplicate tactical roles rejected',`insert into public.records(kind,title,map,data) values('roles','Mirage','Mirage','{"T":{"a":"Entry","b":"Entry"}}')`);
await reject('Timeline outside range rejected',`insert into public.records(kind,title,map,data) values('strat','bad','Mirage','{"side":"T","buy":"Full buy","type":"Selon les rôles","actions":[{"start":150,"end":100,"text":"a","player":"a"}]}')`);

await db.exec("insert into public.records(kind,title,map,data) values('board','Shared setup','Cache','{}')");
await db.exec(`select set_config('request.jwt.claim.sub','${ids[1]}',false);`);
if((await db.query("select * from public.records where kind='board'")).rows.length!==1)throw Error('Member cannot read shared board');
await reject('Player cannot create shared board',"insert into public.records(kind,title,map,data) values('board','Illegal','Cache','{}')");
await reject('Player cannot create private board',"insert into public.records(kind,title,scope,data) values('board','Illegal','personal','{}')");
console.log('Shared board visible to active player: PASS');
await db.close();

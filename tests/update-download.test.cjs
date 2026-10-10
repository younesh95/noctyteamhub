const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const configure=require('../desktop/updates.cjs');
test('Windows update downloads verified bytes and refuses altered installer before execution',async()=>{
 const root=path.resolve('work/update-tests');await fs.mkdir(root,{recursive:true});const tmp=await fs.mkdtemp(path.join(root,'run-'));
 const payload=Buffer.alloc(1000001,7),hash=crypto.createHash('sha256').update(payload).digest('hex');const base='https://github.com/younesh95/noctyteamhub/releases/download/v0.6.0/';const handlers={};let executions=0;
 const fetcher=async url=>String(url).includes('/releases/latest')?Response.json({tag_name:'v0.6.0',assets:[{name:'noctysstartbook.exe',size:payload.length,browser_download_url:base+'noctysstartbook.exe'},{name:'SHA256SUMS.txt',browser_download_url:base+'SHA256SUMS.txt'}]}):new Response(String(url).endsWith('.txt')?hash+'  noctysstartbook.exe\n':payload);
 await configure({app:{getVersion:()=> '0.5.0',getPath:()=>tmp,quit:()=>{}},shell:{openPath:async()=>{executions++;return '';}},handler:(k,f)=>handlers[k]=f,fetcher});
 assert.equal((await handlers['updates:check']()).available,'0.6.0');await handlers['updates:download']();const target=path.join(tmp,'noctys-update-0.6.0.exe');assert.deepEqual(await fs.readFile(target),payload);
 await fs.writeFile(target,'tampered');await assert.rejects(handlers['updates:install'](),/changé/);assert.equal(executions,0);
 await fs.writeFile(target,payload);await handlers['updates:install']();assert.equal(executions,1);
 await fs.rm(tmp,{recursive:true,force:true});
});

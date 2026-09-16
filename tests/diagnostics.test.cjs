const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createDiagnostics}=require('../desktop/diagnostics.cjs');
test('startup diagnostics omit secrets and request data',()=>{
 const directory=path.resolve('work/diagnostics-test');const d=createDiagnostics(directory);
 d.log('test',{version:'0.2.1',errorCode:-1,password:'DO_NOT_LOG',access_token:'SECRET_TOKEN',url:'https://example.test/?key=SECRET_QUERY'});
 const line=fs.readFileSync(d.filename,'utf8').trim().split('\n').at(-1);
 assert.equal(JSON.parse(line).errorCode,'-1');assert(!line.includes('DO_NOT_LOG'));assert(!line.includes('SECRET_'));
});

const fs = require('node:fs');
const path = require('node:path');
// Only allowlisted startup fields. Never log URLs, credentials or IPC arguments.
function createDiagnostics(directory) {
  const filename=path.join(directory,'startup.log');
  const fields=['version','electron','platform','arch','reason','exitCode','errorCode'];
  function log(event,details={}) {
    try {
      fs.mkdirSync(directory,{recursive:true});
      if(fs.existsSync(filename)&&fs.statSync(filename).size>262144)fs.writeFileSync(filename,'');
      const safe={time:new Date().toISOString(),event};
      for(const field of fields)if(['number','boolean','string'].includes(typeof details[field]))safe[field]=String(details[field]).slice(0,120);
      fs.appendFileSync(filename,JSON.stringify(safe)+'\n');
    } catch { /* Diagnostics must never prevent startup. */ }
  }
  return {log,filename};
}
module.exports={createDiagnostics};

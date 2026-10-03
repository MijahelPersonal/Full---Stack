const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const root = path.join(__dirname, '..');
const smoke = process.argv.includes('--smoke');
let server, desktop, stopping = false;
function stop(code) {
 if(stopping)return;
 stopping=true;
 if(desktop)desktop.kill();
 if(server)server.kill();
 process.exitCode=code;
}
process.on('SIGINT',()=>stop(0));
process.on('SIGTERM',()=>stop(0));
(async()=>{
 await new Promise((resolve,reject)=>{
  const probe=net.createServer();
  probe.once('error',()=>reject(new Error('El puerto 4200 está ocupado. Cierra la sesión Angular/Electron anterior antes de iniciar otra.')));
  probe.listen(4200,'localhost',()=>probe.close(resolve));
 });
 server=spawn(process.execPath,[path.join(root,'node_modules/@angular/cli/bin/ng.js'),'serve','--configuration','desktop-development','--host','localhost','--port','4200'],{cwd:root,stdio:'inherit',windowsHide:true});
 server.on('error',error=>{console.error(error.message);stop(1);});
 server.on('exit',code=>{if(!stopping)stop(code||1);});
 const deadline=Date.now()+120000;
 let ready=false;
 while(!stopping&&Date.now()<deadline){
  try{if((await fetch('http://localhost:4200',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 if(stopping)return;
 if(!ready)throw new Error('Angular startup timed out');
 const environment={...process.env};delete environment.ELECTRON_RUN_AS_NODE;
 desktop=spawn(require('electron'),[root,'--dev',...(smoke?['--smoke']:[])],{cwd:root,env:environment,stdio:'inherit',windowsHide:smoke});
 desktop.on('error',error=>{console.error(error.message);stop(1);});
 desktop.on('exit',code=>stop(code===null?1:code));
})().catch(error=>{console.error(error.message);stop(1);});
